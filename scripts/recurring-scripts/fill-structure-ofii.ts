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

    const csvDnaCodes = new Set(validRecords.map((record) => record.dnaCode));

    const dnas = await prisma.dna.findMany({
      where: { code: { in: [...csvDnaCodes] } },
      select: { id: true, code: true },
    });

    const dnaStructuresForCsvCodes = await prisma.dnaStructure.findMany({
      where: { dnaId: { in: dnas.map((dna) => dna.id) } },
      select: { dnaId: true, structureId: true },
    });
    const dnaIdToCode = new Map(dnas.map((dna) => [dna.id, dna.code]));
    const structureIdByDnaCode = new Map<string, number>();
    for (const dnaStructure of dnaStructuresForCsvCodes) {
      const code = dnaIdToCode.get(dnaStructure.dnaId);
      if (code) {
        structureIdByDnaCode.set(code, dnaStructure.structureId);
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const row of validRecords) {
        const now = new Date();
        let dna = await tx.dna.findUnique({ where: { code: row.dnaCode } });
        if (!dna) {
          dna = await tx.dna.create({
            data: { code: row.dnaCode, description: null },
          });
        }

        const existingStructureId = structureIdByDnaCode.get(row.dnaCode);

        if (existingStructureId != null) {
          await tx.structure.update({
            where: { id: existingStructureId },
            data: {
              nomOfii: row.nom ?? undefined,
              directionTerritoriale: row.direction_territoriale ?? undefined,
              inactiveInOfiiFileSince: null,
            },
          });
          updatedCount += 1;
        } else {
          const structure = await tx.structure.create({
            data: {
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
          await tx.dnaStructure.create({
            data: {
              dnaId: dna.id,
              structureId: structure.id,
              startDate: null,
              endDate: null,
            },
          });
          structureIdByDnaCode.set(row.dnaCode, structure.id);
          createdCount += 1;
        }
      }

      const csvDnaCodesSet = new Set(
        records.map((row: OfiiCsvRow) => row.dnaCode)
      );
      const dnasInCsv = await tx.dna.findMany({
        where: { code: { in: [...csvDnaCodesSet] } },
        select: { id: true },
      });
      const dnaIdsInCsv = new Set(dnasInCsv.map((dna) => dna.id));

      const activeStructuresWithDnas = await tx.structure.findMany({
        where: { inactiveInOfiiFileSince: null },
        select: {
          id: true,
          dnaStructures: {
            select: { dnaId: true },
          },
        },
      });

      const structureIdsToDeactivate = activeStructuresWithDnas
        .filter(
          (structure) =>
            structure.dnaStructures.length > 0 &&
            structure.dnaStructures.every(
              (dnaStructure) => !dnaIdsInCsv.has(dnaStructure.dnaId)
            )
        )
        .map((structure) => structure.id);

      if (structureIdsToDeactivate.length > 0) {
        const now = new Date();
        const deactivated = await tx.structure.updateMany({
          where: {
            id: { in: structureIdsToDeactivate },
            inactiveInOfiiFileSince: null,
          },
          data: { inactiveInOfiiFileSince: now },
        });
        console.log(
          `⚠️ ${deactivated.count} structures marquées comme inactives dans le fichier OFII (aucun de leurs codes DNA dans le CSV).`
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
