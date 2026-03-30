// Remplit la table Activite à partir du fichier XLSX OFII (onglet le plus récent).
// Par défaut utilisé par le script fill-referential-and-activity-ofii, peut aussi être utilisé en standalone.
// Usage: yarn script ofii-fill-activity <chemin_vers_fichier.xlsx>

import "dotenv/config";

import type { PrismaClient } from "@/generated/prisma/client";

import { type ActiviteRow } from "./ofii-xlsx";

/*
 * TODO: check later coherence with the way the file is established at OFII
 * Based on discussion we take the percentage into account but it might as well be the original (and incoherent) field
 */
function calculatePlacesVacantesAndPlacesOccupees(
  placesAutorisees: number | null,
  placesIndisponibles: number | null,
  tauxOccupation: number | null
) {
  if (
    placesAutorisees == null ||
    placesIndisponibles == null ||
    tauxOccupation == null
  ) {
    return { placesVacantes: null, placesOccupees: null };
  }
  const placesDisponibles = placesAutorisees - placesIndisponibles;
  const placesOccupees = placesDisponibles * tauxOccupation;
  const placesVacantes = placesDisponibles - placesOccupees;
  return { placesVacantes, placesOccupees };
}

/**
 * Remplit la table Activite pour une date donnée à partir de lignes déjà parsées.
 */
export async function fillOfiiActiviteFromRows(
  prisma: PrismaClient,
  date: Date,
  rows: ActiviteRow[]
) {
  if (rows.length == 0) {
    console.log("❌ Aucune ligne à insérer.");
    return;
  }

  const existingDnaCodes = await prisma.dna.findMany({
    select: { code: true },
  });
  const existingDnaCodeSet = new Set(existingDnaCodes.map((d) => d.code));
  const validRows = rows.filter((row) => existingDnaCodeSet.has(row.dnaCode));
  const invalidCodes = [
    ...new Set(
      rows
        .map((row) => row.dnaCode)
        .filter((code) => !existingDnaCodeSet.has(code))
    ),
  ];

  if (invalidCodes.length > 0) {
    console.log(
      `⚠️ ${rows.length - validRows.length} lignes ignorées (DNA inconnu pour ${date
        .toISOString()
        .slice(0, 10)}): ${invalidCodes
        .slice(0, 10)
        .join(", ")}${invalidCodes.length > 10 ? "..." : ""}`
    );
  }

  if (validRows.length == 0) {
    console.log("❌ Aucune ligne avec DNA valide à insérer.");
    return;
  }

  let created = 0;

  for (const row of validRows) {
    const r = row as ActiviteRow;
    try {
      // TODO : quand on aura repassé le unique sur dna + date, simplifier ici (post rebase)
      const existingActivite = await prisma.activite.findFirst({
        where: { dnaCode: r.dnaCode, date },
        select: { id: true },
      });

      const { placesVacantes, placesOccupees } =
        calculatePlacesVacantesAndPlacesOccupees(
          r.placesAutorisees,
          r.placesIndisponibles,
          r.tauxOccupation
        );

      await prisma.activite.upsert({
        where: { id: existingActivite?.id ?? -1 },
        create: {
          dnaCode: r.dnaCode,
          date,
          placesAutorisees: r.placesAutorisees ?? undefined,
          desinsectisation: r.desinsectisation ?? undefined,
          remiseEnEtat: r.remiseEnEtat ?? undefined,
          sousOccupation: r.sousOccupation ?? undefined,
          travaux: r.travaux ?? undefined,
          placesIndisponibles: r.placesIndisponibles ?? undefined,
          placesOccupees: placesOccupees ?? undefined,
          placesVacantes: placesVacantes ?? undefined,
          presencesInduesBPI: r.presencesInduesBPI ?? undefined,
          presencesInduesDeboutees: r.presencesInduesDeboutees ?? undefined,
        },
        update: {
          placesAutorisees: r.placesAutorisees ?? undefined,
          desinsectisation: r.desinsectisation ?? undefined,
          remiseEnEtat: r.remiseEnEtat ?? undefined,
          sousOccupation: r.sousOccupation ?? undefined,
          travaux: r.travaux ?? undefined,
          placesIndisponibles: r.placesIndisponibles ?? undefined,
          placesOccupees: placesOccupees ?? undefined,
          placesVacantes: placesVacantes ?? undefined,
          presencesInduesBPI: r.presencesInduesBPI ?? undefined,
          presencesInduesDeboutees: r.presencesInduesDeboutees ?? undefined,
        },
      });

      created += 1;
    } catch (error) {
      throw new Error(
        "❌ Erreur lors du chargement des données d'activité : " + error
      );
    }
  }
  console.log(`✅ Activité mise à jour: ${created} lignes traitées`);
}
