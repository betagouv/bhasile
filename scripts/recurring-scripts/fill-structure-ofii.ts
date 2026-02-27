// Fill Structure table with CSV from S3 bucket (référentiel OFII)
// Par défaut utilisé par le script fill-referential-and-activity-ofii, peut aussi être utilisé en standalone.
// Usage: yarn script fill-structure-ofii my_structure_ofii_file.csv

import "dotenv/config";

import type { PrismaClient } from "@/generated/prisma/client";
import { StructureType } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";
import { checkBucket, getObject } from "@/lib/minio";

import { ensureOperateursExist } from "../utils/ensure-operateurs-exist";
import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";
import { loadOfiiFile, type OfiiReferentialRow } from "../utils/ofii-xlsx";

type OperateurMapping = Record<string, string>;

async function loadOperateurMappingFromS3(
  bucketName: string,
  objectName: string
): Promise<OperateurMapping> {
  console.log(
    `Chargement du mapping opérateurs depuis S3: bucket=${bucketName}, key=${objectName}`
  );
  await checkBucket(bucketName);
  const stream = await getObject(bucketName, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const json = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(json) as OperateurMapping;
}

/**
 * Remplit/actualise les structures OFII à partir de lignes déjà normalisées
 */
export const fillOfiiStructureFromRows = async (
  prisma: PrismaClient,
  records: OfiiReferentialRow[]
) => {
  try {
    if (records.length === 0) {
      return;
    }

    console.log("Résolution des IDs des départements...");
    const departements = await prisma.departement.findMany({
      select: { numero: true },
    });
    const departementSet = new Set(departements.map((d) => d.numero));

    console.log("Validation des données...");
    const validRecords: OfiiReferentialRow[] = [];
    const errors: { dnaCode: string; issues: string[] }[] = [];

    for (const row of records) {
      const issues: string[] = [];
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

    // Normalisation des noms d'opérateur
    const bucketName = process.env.DOCS_BUCKET_NAME;
    const operateurMappingKey =
      process.env.OFII_OPERATEUR_MAPPING_KEY ?? "ofii-operateurs-mapping.json";
    let operateurMapping: OperateurMapping | null = null;
    if (bucketName) {
      try {
        operateurMapping = await loadOperateurMappingFromS3(
          bucketName,
          operateurMappingKey
        );
      } catch (error) {
        console.warn(
          "⚠️ Impossible de charger le mapping opérateurs depuis S3, utilisation des noms bruts.",
          error
        );
      }
    }

    if (operateurMapping) {
      for (const row of validRecords) {
        if (row.operateur) {
          const mapped = operateurMapping[row.operateur] ?? row.operateur;
          row.operateur = mapped;
        }
      }
    }

    const existingStructures = await prisma.structure.findMany({
      where: {
        dnaCode: { in: validRecords.map((r) => r.dnaCode) },
      },
      select: {
        dnaCode: true,
        activeInOfiiFileSince: true,
        inactiveInOfiiFileSince: true,
      },
    });
    const existingByDnaCode = new Map(
      existingStructures.map((s) => [s.dnaCode, s])
    );

    const recordsToCreate = validRecords.filter(
      (record) => !existingByDnaCode.has(record.dnaCode)
    );

    let operateurMap = new Map<string, number>();
    if (recordsToCreate.length > 0) {
      console.log(
        `Résolution des opérateurs pour ${recordsToCreate.length} nouvelles structures...`
      );
      try {
        operateurMap = await ensureOperateursExist(
          prisma,
          recordsToCreate,
          "operateur"
        );
      } catch (error) {
        console.error(
          "❌ Arrêt du script : des opérateurs présents dans le fichier OFII sont inconnus en base."
        );
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error(error);
        }
        process.exit(1);
      }
    }

    console.log("Mise à jour des données OFII...");
    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of validRecords) {
        const existing = existingByDnaCode.get(row.dnaCode);
        const now = new Date();

        await tx.structure.upsert({
          where: { dnaCode: row.dnaCode },
          update: {
            nomOfii: row.nom ?? undefined,
            inactiveInOfiiFileSince: null,
          },
          create: {
            dnaCode: row.dnaCode,
            nom: row.nom,
            type: row.type as StructureType,
            departementAdministratif: row.departement ?? undefined,
            nomOfii: row.nom ?? undefined,
            directionTerritoriale: row.directionTerritoriale ?? undefined,
            activeInOfiiFileSince: now,
            inactiveInOfiiFileSince: null,
            operateurId: row.operateur
              ? (operateurMap.get(row.operateur) ?? null)
              : null,
          },
        });

        if (existing) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }
      }

      const csvDnaCodes = new Set(validRecords.map((r) => r.dnaCode));
      const allActiveOfiiStructures = await tx.structure.findMany({
        where: { inactiveInOfiiFileSince: null },
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
  }
};

// Standalone part

const args = process.argv.slice(2);
const xlsxKey = args[0];

if (!xlsxKey) {
  throw new Error("Merci de fournir la clef S3 du fichier XLSX en argument.");
}

const prisma = createPrismaClient();

const fillReferential = async () => {
  try {
    const bucketName = process.env.DOCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error(
        "DOCS_BUCKET_NAME doit être défini pour charger le fichier XLSX depuis S3."
      );
    }

    console.log("Chargement du fichier XLSX depuis S3 (référentiel OFII)...");
    const { buffer, fileName } = await loadXlsxBufferFromS3(
      bucketName,
      xlsxKey
    );
    const { rows } = loadOfiiFile(buffer, fileName);

    await fillOfiiStructureFromRows(prisma, rows);
  } finally {
    await prisma.$disconnect();
  }
};

fillReferential();
