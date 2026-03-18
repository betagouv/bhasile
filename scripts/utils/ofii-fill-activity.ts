// Remplit la table Activite à partir du fichier XLSX OFII (onglet le plus récent).
// Par défaut utilisé par le script fill-referential-and-activity-ofii, peut aussi être utilisé en standalone.
// Usage: yarn script ofii-fill-activity <chemin_vers_fichier.xlsx>

import "dotenv/config";

import type { PrismaClient } from "@/generated/prisma/client";

import { type ActiviteRow } from "./ofii-xlsx";

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

  const dnaCodes = [...new Set(rows.map((r) => r.dnaCode))];
  const existingStructures = await prisma.structure.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: { dnaCode: true },
  });
  const validDnaSet = new Set(existingStructures.map((s) => s.dnaCode));

  const validRows = rows.filter((r) => validDnaSet.has(r.structureDnaCode));
  const invalidCodes = [
    ...new Set(
      rows.map((r) => r.structureDnaCode).filter((c) => !validDnaSet.has(c))
    ),
  ];
  if (invalidCodes.length > 0) {
    console.log(
      `⚠️ ${rows.length - validRows.length} lignes ignorées (structure absente de la base): ${invalidCodes
        .slice(0, 10)
        .join(", ")}${invalidCodes.length > 10 ? "..." : ""}`
    );
  }

  if (validRows.length == 0) {
    console.log("❌ Aucune ligne avec structure valide à insérer.");
    return;
  }

  let created = 0;

  for (const row of validRows) {
    const r = row as ActiviteRow;
    try {
      await prisma.activite.upsert({
        where: {
          structureId_date: {
            structureId: r.structureId,
            date,
          },
        },
        create: {
          structureId: r.structureId,
          dnaCode: r.dnaCode,
          date,
          placesAutorisees: r.placesAutorisees ?? undefined,
          desinsectisation: r.desinsectisation ?? undefined,
          remiseEnEtat: r.remiseEnEtat ?? undefined,
          sousOccupation: r.sousOccupation ?? undefined,
          travaux: r.travaux ?? undefined,
          placesIndisponibles: r.placesIndisponibles ?? undefined,
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
