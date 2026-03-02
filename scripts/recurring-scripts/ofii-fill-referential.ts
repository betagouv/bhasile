// Fill Structure table with CSV from S3 bucket (référentiel OFII)
// Par défaut utilisé par le script fill-referential-and-activity-ofii, peut aussi être utilisé en standalone.
// Usage: yarn script ofii-fill-referential my_structure_ofii_file.csv

import "dotenv/config";

import type { PrismaClient } from "@/generated/prisma/client";
import { StructureType } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";
import { checkBucket, getObject } from "@/lib/minio";

import { ensureOperateursExist } from "../utils/ensure-operateurs-exist";
import { loadXlsxBufferFromS3 } from "../utils/xlsx-loader";
import { loadOfiiFile, type OfiiReferentialRow } from "../utils/ofii-xlsx";

type OperateurMapping = Record<string, string>;

const PREFIXES_TO_REMOVE = [
  "CADA",
  "PRAHDA",
  "HUDA",
  "CPH",
  "CAES",
  "NUITEE HOTELIERE",
  "CENTRE D'ACCUEIL DEMANDEURS D'ASILE",
  "CENTRE D'ACCUEIL POUR DEMANDEURS D'ASILE",
  "ACCUEIL D'URGENCE DES DEMANDEURS D'ASILE",
  "HEBERGEMENT D'URGENCE",
] as const;

function stripAndUpper(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function collapseSpaces(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

function deptCodeFromCode(code: string | null | undefined): string {
  if (!code || code.length < 3) return "";
  const two = code.slice(1, 3);
  const three = code.slice(1, 4);
  const n = parseInt(two, 10);
  return n > 96 ? three : two;
}

type CleanNameOptions = {
  departementNumero?: string | null;
  operateurClean?: string | null;
};

function getCleanName(
  row: OfiiReferentialRow,
  options: CleanNameOptions = {}
): string {
  const { departementNumero, operateurClean } = options;

  const nom = stripAndUpper(row.nom);
  const operateurUpper = stripAndUpper(row.operateur);
  const code = row.dnaCode ?? "";
  const categorieDeCentre = stripAndUpper(row.type);

  let cleanName = nom;

  for (const prefix of PREFIXES_TO_REMOVE) {
    cleanName = cleanName.replace(prefix, "");
  }

  const deptCode = deptCodeFromCode(code);
  const deptCodeFromDepartment = departementNumero ?? null;

  if (deptCodeFromDepartment) {
    cleanName = cleanName.replace(deptCodeFromDepartment, "");
  }

  const finalOperateurClean = stripAndUpper(operateurClean ?? operateurUpper);

  const operatorsToRemove = Array.from(
    new Set([finalOperateurClean, operateurUpper].filter(Boolean))
  );
  for (const op of operatorsToRemove) {
    cleanName = cleanName.replace(op, "");
  }

  let categorie = categorieDeCentre.replace("NUITEE HOTELIERE", "NH");

  let fullName = `${categorie} ${cleanName} ${finalOperateurClean} - ${deptCode}`;

  return collapseSpaces(fullName).trim();
}

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
  date: Date,
  records: OfiiReferentialRow[]
) => {
  try {
    if (records.length == 0) {
      return;
    }

    // Fichier OFII = nom de département (ex. Allier). En base on stocke le numéro (ex. 03).
    console.log("Résolution départements (nom → numéro)...");
    const departements = await prisma.departement.findMany({
      select: { numero: true, name: true },
    });
    const nameToNumero = new Map<string, string>(
      departements.map((d) => [d.name.trim().toLowerCase(), d.numero])
    );

    console.log("Validation des données...");
    const validRecords: OfiiReferentialRow[] = [];
    const errors: { dnaCode: string; issues: string[] }[] = [];

    for (const row of records) {
      const issues: string[] = [];
      const departementName = row.departement?.trim();
      const departementNumero = departementName
        ? nameToNumero.get(departementName.toLowerCase())
        : undefined;
      if (!departementName || departementNumero == undefined) {
        issues.push(`département invalide (nom attendu) : ${row.departement}`);
      }

      const allowedTypes = new Set<string>(Object.values(StructureType));
      if (!row.type || !allowedTypes.has(row.type)) {
        issues.push(`type de structure invalide : ${row.type}`);
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

    if (validRecords.length == 0) {
      console.log("❌ Aucune donnée valide à insérer");
      return;
    }

    console.log(
      `✓ ${validRecords.length} lignes valides sur ${records.length}`
    );

    // Normalisation des noms d'opérateur
    const bucketName = process.env.DOCS_BUCKET_NAME;
    const operateurMappingKey =
      process.env.OFII_OPERATEUR_MAPPING_KEY ?? "operateurs_to_match.json";
    let operateurMapping: OperateurMapping | null = null;
    if (bucketName) {
      try {
        operateurMapping = await loadOperateurMappingFromS3(
          bucketName,
          operateurMappingKey
        );
      } catch (error) {
        throw new Error(
          "❌ Impossible de charger le mapping opérateurs depuis S3"
        );
      }
    }

    for (const row of validRecords) {
      if (row.operateur) {
        const mapped = operateurMapping![row.operateur];
        row.operateur = mapped;
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
        throw new Error(
          "❌ Des opérateurs présents dans le fichier OFII sont inconnus en base."
        );
      }
    }

    console.log("Mise à jour des données OFII...");
    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of validRecords) {
        const existing = existingByDnaCode.get(row.dnaCode);
        const now = new Date();

        const depKey = row.departement
          ? row.departement.trim().toLowerCase()
          : "";
        const depNumero = depKey ? (nameToNumero.get(depKey) ?? null) : null;
        const cleanName = getCleanName(row, {
          departementNumero: depNumero,
          operateurClean: row.operateur,
        });
        await tx.structure.upsert({
          where: { dnaCode: row.dnaCode },
          update: {
            nom: cleanName,
            nomOfii: row.nom ?? undefined,
            inactiveInOfiiFileSince: null,
          },
          create: {
            dnaCode: row.dnaCode,
            nom: cleanName,
            type: row.type as StructureType,
            departementAdministratif: depNumero ?? undefined,
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
        const deactivated = await tx.structure.updateMany({
          where: {
            dnaCode: { in: dnaCodesToDeactivate },
            inactiveInOfiiFileSince: null,
          },
          data: { inactiveInOfiiFileSince: date },
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
    throw new Error(
      "❌ Erreur lors du chargement des données référentiel : " + error
    );
  }
};

// Standalone part

const isMainScript =
  process.argv[1] && process.argv[1] == "ofii-fill-referential";

if (isMainScript) {
  console.log("Running standalone part of ofii-fill-referential");
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

      console.log("Chargement du fichier XLSX depuis S3 (référentiel OFII)...");
      const { buffer, fileName } = await loadXlsxBufferFromS3(
        bucketName,
        xlsxKey
      );
      const { date, rows } = loadOfiiFile(buffer, fileName);

      await fillOfiiStructureFromRows(prisma, date, rows);
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'exécution du script référentiel OFII",
        error
      );
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}
