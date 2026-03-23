// Fill Structure table with CSV from S3 bucket (référentiel OFII)
// Utilisé par le script fill-referential-and-activity-ofii.
// Usage: yarn script ofii-fill-referential my_structure_ofii_file.csv

import "dotenv/config";

import {
  getNextBhasileCode,
  normalizeRegionCode,
} from "@/app/utils/bhasile.util";
import type { PrismaClient } from "@/generated/prisma/client";
import { StructureType } from "@/generated/prisma/client";
import { checkBucket, getObject } from "@/lib/minio";

import { ensureOperateursExist } from "./ensure-operateurs-exist";
import { type OfiiReferentialRow } from "./ofii-xlsx";

type OperateurMapping = Record<string, string>;
type DepartementRecord = {
  numero: string;
  name: string;
  regionAdministrative: { name: string; code: string } | null;
};

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
  if (!code || code.length < 3) {
    return "";
  }
  const two = code.slice(1, 3);
  const three = code.slice(1, 4);
  const n = parseInt(two, 10);
  return n > 96 ? three : two;
}

function resolveDepartementNumero(
  departementName: string | null | undefined,
  nameToNumero: Map<string, string>
): string | null {
  if (!departementName) {return null;}
  return nameToNumero.get(departementName.trim().toLowerCase()) ?? null;
}

function buildDepartementMaps(departements: DepartementRecord[]) {
  const nameToNumero = new Map<string, string>(
    departements.map((d) => [d.name.trim().toLowerCase(), d.numero])
  );

  const numeroToRegionCode = new Map<string, string>();
  for (const departement of departements) {
    const regionCode = normalizeRegionCode(
      departement.regionAdministrative?.code
    );
    if (!regionCode) {continue;}
    numeroToRegionCode.set(departement.numero, regionCode);
  }

  return { nameToNumero, numeroToRegionCode };
}

function getCleanName(
  row: OfiiReferentialRow,
  departementNumero?: string | null,
  operateurClean?: string | null
): string {
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

  const categorie = categorieDeCentre.replace("NUITEE HOTELIERE", "NH");

  const fullName = `${categorie} ${cleanName} ${finalOperateurClean} - ${deptCode}`;

  return collapseSpaces(fullName);
}

async function loadOperateurMappingFromS3(
  bucketName: string,
  objectName: string
): Promise<OperateurMapping> {
  console.log(
    `- Chargement du mapping opérateurs depuis S3: bucket=${bucketName}, key=${objectName}`
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

    const departements: DepartementRecord[] = await prisma.departement.findMany(
      {
        select: {
          numero: true,
          name: true,
          regionAdministrative: {
            select: { name: true, code: true },
          },
        },
      }
    );
    const { nameToNumero, numeroToRegionCode } =
      buildDepartementMaps(departements);

    console.log("- Validation des données...");
    const validRecords: OfiiReferentialRow[] = [];
    const errors: { dnaCode: string; issues: string[] }[] = [];

    for (const row of records) {
      const issues: string[] = [];
      const departementNumero = resolveDepartementNumero(
        row.departement,
        nameToNumero
      );
      if (!departementNumero) {
        issues.push(`département invalide (nom attendu) : ${row.departement}`);
      } else if (!numeroToRegionCode.get(departementNumero)) {
        issues.push(
          `région introuvable pour le département : ${departementNumero}`
        );
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
          "❌ Impossible de charger le mapping opérateurs depuis S3" + error
        );
      }
    }

    for (const row of validRecords) {
      if (row.operateur) {
        const mapped = operateurMapping![row.operateur];
        row.operateur = mapped;
      }
    }

    let operateurMap = new Map<string, number>();
    try {
      operateurMap = await ensureOperateursExist(
        prisma,
        validRecords,
        "operateur"
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        "❌ Des opérateurs présents dans le fichier OFII sont inconnus en base." +
          error
      );
    }

    console.log("- Mise à jour des données de référentiel");
    const updatedCount = 0;
    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      const regionCounterCache = new Map<string, number>();
      const dnaToStructureId = new Map<string, number>();
      const structureById = new Map<
        number,
        {
          id: number;
          dnaCode: string | null;
        }
      >();
      const presentDnaCodes = new Set<string>();

      // 1. For each DNA: create DNA if missing, then ensure it is linked to a structure.
      for (const row of validRecords) {
        const depNumero = resolveDepartementNumero(
          row.departement,
          nameToNumero
        );
        if (!depNumero) {
          continue;
        }

        const dna = await tx.dna.upsert({
          where: { code: row.dnaCode },
          create: {
            code: row.dnaCode,
            description: null,
            activeInOfiiFileSince: date,
            inactiveInOfiiFileSince: null,
          },
          update: {
            inactiveInOfiiFileSince: null,
          },
          select: {
            id: true,
            code: true,
            activeInOfiiFileSince: true,
            dnaStructures: {
              select: { structureId: true },
              take: 1,
            },
          },
        });
        presentDnaCodes.add(dna.code);

        let structureId = dna.dnaStructures[0]?.structureId;

        if (!structureId) {
          const regionCode = numeroToRegionCode.get(depNumero);
          if (!regionCode) {
            throw new Error(
              `Région introuvable pour le département ${depNumero} (DNA ${row.dnaCode})`
            );
          }

          const codeBhasile = await getNextBhasileCode(
            tx,
            regionCode,
            regionCounterCache
          );
          const cleanName = getCleanName(row, depNumero, row.operateur);

          const createdStructure = await tx.structure.create({
            data: {
              codeBhasile,
              nom: cleanName,
              nomOfii: row.nom ?? undefined,
              type: row.type as StructureType,
              departementAdministratif: depNumero,
              directionTerritoriale: row.directionTerritoriale ?? undefined,
              operateurId: row.operateur
                ? (operateurMap.get(row.operateur) ?? null)
                : null,
            },
            select: {
              id: true,
              dnaCode: true,
            },
          });

          await tx.dnaStructure.create({
            data: {
              dna: { connect: { id: dna.id } },
              structure: { connect: { id: createdStructure.id } },
              startDate: null,
              endDate: null,
            },
          });

          structureId = createdStructure.id;
          structureById.set(createdStructure.id, createdStructure);
          createdCount += 1;
        } else if (!structureById.has(structureId)) {
          const existingStructure = await tx.structure.findUnique({
            where: { id: structureId },
            select: {
              id: true,
              dnaCode: true,
            },
          });
          if (existingStructure) {
            structureById.set(existingStructure.id, existingStructure);
          }
        }

        dnaToStructureId.set(row.dnaCode, structureId);
      }

      // 2. Deactivate DNAs that are absent from current OFII file.

      const allActiveOfiiDnas = await tx.dna.findMany({
        where: { inactiveInOfiiFileSince: null },
        select: { id: true, code: true },
      });

      const dnaIdsToDeactivate = allActiveOfiiDnas
        .filter((dna) => !presentDnaCodes.has(dna.code))
        .map((dna) => dna.id);

      if (dnaIdsToDeactivate.length > 0) {
        const deactivated = await tx.dna.updateMany({
          where: {
            id: { in: dnaIdsToDeactivate },
            inactiveInOfiiFileSince: null,
          },
          data: { inactiveInOfiiFileSince: date },
        });
        console.log(
          `- ⚠️ ${deactivated.count} DNA marqués comme inactifs dans le fichier OFII.`
        );
      } else {
        console.log("- Aucun DNA à désactiver.");
      }
    });

    console.log(`✅ ${updatedCount} structures mises à jour`);
    console.log(`✅ ${createdCount} structures créées`);
  } catch (error) {
    throw new Error(
      "❌ Erreur lors du chargement des données référentiel : " + error
    );
  }
};
