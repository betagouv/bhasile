// Remplit la table Activite à partir du fichier XLSX OFII (onglet le plus récent).
// Par défaut utilisé par le script fill-referential-and-activity-ofii, peut aussi être utilisé en standalone.
// Usage: yarn script ofii-fill-activity <chemin_vers_fichier.xlsx>

import "dotenv/config";

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";
import { loadOfiiFile, type ActiviteRow } from "../utils/ofii-xlsx";
import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";

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

  const dnaCodes = [...new Set(rows.map((r) => r.structureDnaCode))];
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
          structureDnaCode_date: {
            structureDnaCode: r.structureDnaCode,
            date,
          },
        },
        create: {
          structureDnaCode: r.structureDnaCode,
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

// Standalone part

const isMainScript = process.argv[1] && process.argv[1] == "ofii-fill-activity";

if (isMainScript) {
  console.log("Running standalone part of ofii-fill-activity");
  const args = process.argv.slice(2);
  const xlsxKey = args[0];

  if (!xlsxKey) {
    throw new Error("Merci de fournir la clef S3 du fichier XLSX en argument.");
  }

  const prisma = createPrismaClient();

  (async () => {
    try {
      const bucketName = process.env.DOCS_BUCKET_NAME;
      if (!bucketName) {
        throw new Error(
          "DOCS_BUCKET_NAME doit être défini pour charger le fichier XLSX depuis S3."
        );
      }

      console.log("Chargement du fichier XLSX depuis S3...");
      const { buffer, fileName } = await loadXlsxBufferFromS3(
        bucketName,
        xlsxKey
      );
      const { date, rows } = loadOfiiFile(buffer, fileName);
      console.log(
        `Onglet traité: date ${date.toISOString().slice(0, 7)}, ${rows.length} lignes`
      );

      await fillOfiiActiviteFromRows(prisma, date, rows);
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'exécution du script activité OFII",
        error
      );
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
