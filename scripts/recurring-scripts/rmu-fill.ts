// Lit un fichier XLSX "Suivi RMU" et remplit la table Rmu (par département).
// Usage: yarn script rmu-fill <chemin_ou_clef_s3_du_xlsx>

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { loadRmuFile, type RmuRow } from "../utils/rmu-xlsx";
import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";

const args = process.argv.slice(2);
const xlsxLocation = args[0];

if (!xlsxLocation) {
  throw new Error("Merci de fournir la clef S3 du fichier XLSX en argument.");
}

const prisma = createPrismaClient();

function buildDepartementNameToNumero(
  departements: { numero: string; name: string }[]
): Map<string, string> {
  return new Map(
    departements.map((departement) => [
      departement.name.trim().toLowerCase(),
      departement.numero,
    ])
  );
}

/**
 * Remplit/actualise la table Rmu pour un ensemble de lignes déjà parsées.
 */
async function fillRmuFromRows(rows: RmuRow[]) {
  if (rows.length === 0) {
    console.log("❌ Aucune ligne à insérer.");
    return;
  }

  const departements = await prisma.departement.findMany({
    select: { numero: true, name: true },
  });
  const nameToNumero = buildDepartementNameToNumero(departements);

  const unmatchedNames = new Set<string>();
  let upsertedCount = 0;

  for (const row of rows) {
    const departementNumero = nameToNumero.get(
      row.departementNom.trim().toLowerCase()
    );

    if (!departementNumero) {
      unmatchedNames.add(row.departementNom);
      continue;
    }

    await prisma.rmu.upsert({
      where: {
        departementNumero_date: {
          departementNumero,
          date: row.date,
        },
      },
      create: {
        departementNumero,
        date: row.date,
        deboutesSortisSansMesureAdministrative:
          row.deboutesSortisSansMesureAdministrative ?? undefined,
        misesEnDemeureDeQuitterLesLieux:
          row.misesEnDemeureDeQuitterLesLieux ?? undefined,
        referesMesuresUtilesEngages:
          row.referesMesuresUtilesEngages ?? undefined,
        referesMesuresUtilesExecutes:
          row.referesMesuresUtilesExecutes ?? undefined,
      },
      update: {
        deboutesSortisSansMesureAdministrative:
          row.deboutesSortisSansMesureAdministrative ?? undefined,
        misesEnDemeureDeQuitterLesLieux:
          row.misesEnDemeureDeQuitterLesLieux ?? undefined,
        referesMesuresUtilesEngages:
          row.referesMesuresUtilesEngages ?? undefined,
        referesMesuresUtilesExecutes:
          row.referesMesuresUtilesExecutes ?? undefined,
      },
    });
    upsertedCount += 1;
  }

  if (unmatchedNames.size > 0) {
    console.log(
      `⚠️ ${unmatchedNames.size} bloc(s) ignoré(s) (nom non reconnu comme département, ex. total région) : ${[
        ...unmatchedNames,
      ].join(", ")}`
    );
  }

  console.log(`✅ Rmu mis à jour : ${upsertedCount} ligne(s) traitée(s)`);
}

async function main() {
  try {
    const bucketName = process.env.DOCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error(
        "DOCS_BUCKET_NAME doit être défini pour charger le fichier XLSX depuis S3."
      );
    }

    const { buffer } = await loadXlsxBufferFromS3(bucketName, xlsxLocation);

    console.log("📥 Extraction des données RMU depuis le XLSX...");
    const rows = loadRmuFile(buffer);
    console.log(`✓ ${rows.length} ligne(s) (département x mois) trouvée(s)`);

    console.log("Mise à jour de la table Rmu...");
    await fillRmuFromRows(rows);

    console.log("✅ Données RMU mises à jour avec succès.");
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution du script RMU", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
