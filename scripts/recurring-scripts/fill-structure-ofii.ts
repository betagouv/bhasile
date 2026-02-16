// Fill Structure table with csv from s3 bucket
// Usage: yarn script fill-structure-ofii my_structure_ofii_file.csv
// An example of the csv file is available at /public/ofii_example.csv

import "dotenv/config";

import { StructureType } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

import { loadCsvFromS3 } from "../utils/csv-loader";
import { ensureOperateursExist } from "../utils/ensure-operateurs-exist";

const prisma = createPrismaClient();
const bucketName = process.env.DOCS_BUCKET_NAME!;
const args = process.argv.slice(2);
const csvFilename = args[0];

if (!csvFilename) {
  throw new Error(
    "Merci de fournir le nom du fichier CSV en argument du script."
  );
}

type OfiiCsvRow = {
  dnaCode: string;
  nom: string;
  type: string;
  operateur_nom?: string;
  departement: string;
  direction_territoriale?: string;
  nom_ofii?: string;
};

// Open csv and load data into Structure table (OFII-related fields only)
const loadDataToOfiiTable = async () => {
  try {
    const records = await loadCsvFromS3<OfiiCsvRow>(bucketName, csvFilename);

    if (records.length === 0) {
      return;
    }

    console.log("Résolution des IDs des opérateurs...");
    const operateurMap = await ensureOperateursExist(
      prisma,
      records,
      "operateur_nom"
    );

    console.log("Résolution des IDs des départements...");
    const departements = await prisma.departement.findMany({
      select: { numero: true },
    });
    const departementSet = new Set(
      departements.map((departement) => departement.numero)
    );

    // Validate data
    console.log("Validation des données...");

    const validRecords: OfiiCsvRow[] = [];
    const errors: { dnaCode: string; issues: string[] }[] = [];

    for (const row of records as OfiiCsvRow[]) {
      const issues = [];

      if (!row.departement || !departementSet.has(row.departement)) {
        issues.push(`département invalide: ${row.departement}`);
      }

      if (issues.length > 0) {
        errors.push({ dnaCode: row.dnaCode, issues });
      } else {
        validRecords.push(row);
      }
    }

    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} lignes avec erreurs :`);
      errors.slice(0, 10).forEach((err) => {
        console.log(`  - ${err.dnaCode}: ${err.issues.join(", ")}`);
      });
      if (errors.length > 10) {
        console.log(`  ... et ${errors.length - 10} autres erreurs`);
      }
    }

    if (validRecords.length === 0) {
      console.log("❌ Aucune donnée valide à insérer");
      return;
    }

    console.log(
      `✓ ${validRecords.length} lignes valides sur ${records.length}`
    );

    console.log("Mise à jour des données ofii...");
    let createdCount = 0;
    let updatedCount = 0;

    const existingStructures = await prisma.structure.findMany({
      where: {
        dnaCode: { in: validRecords.map((structure) => structure.dnaCode) },
      },
      select: {
        dnaCode: true,
        activeInOfiiFileSince: true,
        inactiveInOfiiFileSince: true,
      },
    });
    const existingByDnaCode = new Map(
      existingStructures.map((structure) => [structure.dnaCode, structure])
    );

    await prisma.$transaction(async (tx) => {
      for (const row of validRecords) {
        const existing = existingByDnaCode.get(row.dnaCode);
        const now = new Date();

        await tx.structure.upsert({
          where: { dnaCode: row.dnaCode },
          update: {
            nomOfii: row.nom ?? undefined,
            directionTerritoriale: row.direction_territoriale ?? undefined,
            inactiveInOfiiFileSince: null,
          },
          create: {
            dnaCode: row.dnaCode,
            nom: row.nom,
            type: row.type as StructureType,
            departementAdministratif: row.departement ?? undefined,
            nomOfii: row.nom ?? undefined,
            directionTerritoriale: row.direction_territoriale ?? undefined,
            activeInOfiiFileSince: now,
            inactiveInOfiiFileSince: null,
            operateurId: row.operateur_nom
              ? (operateurMap.get(row.operateur_nom) ?? null)
              : null,
          },
        });

        if (existing) {updatedCount += 1;}
        else {createdCount += 1;}
      }

      // Deactivate structures that are not in the CSV
      const csvDnaCodes = new Set(records.map((row) => row.dnaCode));

      const allActiveOfiiStructures = await tx.structure.findMany({
        where: {
          inactiveInOfiiFileSince: null,
        },
        select: { dnaCode: true },
      });

      const dnaCodesToDeactivate = allActiveOfiiStructures
        .map((s) => s.dnaCode)
        .filter((dnaCode) => !csvDnaCodes.has(dnaCode));

      if (dnaCodesToDeactivate.length > 0) {
        const now = new Date();
        const deactivated = await tx.structure.updateMany({
          where: {
            dnaCode: { in: dnaCodesToDeactivate },
            inactiveInOfiiFileSince: null,
          },
          data: { inactiveInOfiiFileSince: now },
        });
        console.log(
          `⚠️ ${deactivated.count} structures marquées comme inactives dans le fichier OFII (absentes du CSV).`
        );
      } else {
        console.log("Aucune structure à désactiver.");
      }
    });

    console.log(
      `✅ ${createdCount} structures créées, ${updatedCount} structures mises à jour`
    );
  } catch (error) {
    console.error("❌ Erreur lors du chargement des données:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

loadDataToOfiiTable();
