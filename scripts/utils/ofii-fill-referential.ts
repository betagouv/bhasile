// Fill Structure table with CSV from S3 bucket (référentiel OFII)
// Utilisé par le script fill-referential-and-activity-ofii.
// Usage: yarn script ofii-fill-referential my_structure_ofii_file.csv

import "dotenv/config";

import { getNextBhasileCode, normalizeRegionCode } from "@/app/utils/bhasile.util";
import { REGIONS } from "@/constants";
import type { PrismaClient } from "@/generated/prisma/client";
import { StructureType } from "@/generated/prisma/client";
import { checkBucket, getObject } from "@/lib/minio";

import { ensureOperateursExist } from "./ensure-operateurs-exist";
import { type OfiiReferentialRow } from "./ofii-xlsx";

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
  if (!code || code.length < 3) {
    return "";
  }
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

  const categorie = categorieDeCentre.replace("NUITEE HOTELIERE", "NH");

  const fullName = `${categorie} ${cleanName} ${finalOperateurClean} - ${deptCode}`;

  return collapseSpaces(fullName).trim();
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

    const departements = await prisma.departement.findMany({
      select: {
        numero: true,
        name: true,
        regionAdministrative: {
          select: { name: true, code: true },
        },
      },
    });
    const nameToNumero = new Map<string, string>(
      departements.map((d) => [d.name.trim().toLowerCase(), d.numero])
    );
    const numeroToRegionCode = new Map<string, string>(
      departements
        .map((d) => [
          d.numero,
          normalizeRegionCode(d.regionAdministrative?.code) ??
            normalizeRegionCode(
              REGIONS.find((r) => r.name === d.regionAdministrative?.name)?.code
            ),
        ] as const)
        .filter((entry): entry is [string, string] => !!entry[1])
    );

    console.log("- Validation des données...");
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

    const dnaCodes = [...new Set(validRecords.map((r) => r.dnaCode))];
    const dnaMappings = await prisma.dnaStructure.findMany({
      where: {
        dna: { code: { in: dnaCodes } },
      },
      select: { structureId: true, dna: { select: { code: true } } },
    });

    const dnaToStructureId = new Map(
      dnaMappings.map(
        (mapping) => [mapping.dna.code, mapping.structureId] as const
      )
    );

    const validRecordsWithStructure = validRecords.filter((row) =>
      dnaToStructureId.has(row.dnaCode)
    );

    const unmappedDnaCodes = [
      ...new Set(
        validRecords
          .map((row) => row.dnaCode)
          .filter((code) => !dnaToStructureId.has(code))
      ),
    ];
    if (unmappedDnaCodes.length > 0) {
      console.log(
        `⚠️ ${unmappedDnaCodes.length} DNA du fichier OFII sans rattachement à une structure (ignorés pour la mise à jour Structure): ${unmappedDnaCodes
          .slice(0, 10)
          .join(", ")}${unmappedDnaCodes.length > 10 ? "..." : ""}`
      );
    }

    const structureIds = [
      ...new Set(
        validRecordsWithStructure.map((r) => dnaToStructureId.get(r.dnaCode)!)
      ),
    ];

    const existingStructures = await prisma.structure.findMany({
      where: { id: { in: structureIds } },
      select: {
        id: true,
        dnaCode: true,
        activeInOfiiFileSince: true,
        inactiveInOfiiFileSince: true,
      },
    });
    const structureById = new Map(existingStructures.map((s) => [s.id, s]));

    const recordsByStructureId = new Map<number, OfiiReferentialRow[]>();
    for (const row of validRecordsWithStructure) {
      const structureId = dnaToStructureId.get(row.dnaCode)!;
      const list = recordsByStructureId.get(structureId) ?? [];
      list.push(row);
      recordsByStructureId.set(structureId, list);
    }

    const representativeRows: {
      structureId: number;
      row: OfiiReferentialRow;
    }[] = [];
    for (const [structureId, rows] of recordsByStructureId.entries()) {
      const existing = structureById.get(structureId);
      const preferred =
        (existing?.dnaCode
          ? rows.find((row) => row.dnaCode === existing.dnaCode)
          : undefined) ?? rows[0];
      representativeRows.push({ structureId, row: preferred });
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
    let updatedCount = 0;
    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      const regionCounterCache = new Map<string, number>();

      // For each DNA: create DNA if missing, then ensure it is linked to a structure.
      for (const row of validRecords) {
        const existingDna = await tx.dna.findUnique({
          where: { code: row.dnaCode },
          select: {
            id: true,
            dnaStructures: {
              select: { structureId: true },
              take: 1,
            },
          },
        });

        if (existingDna?.dnaStructures.length) {
          if (!dnaToStructureId.has(row.dnaCode)) {
            dnaToStructureId.set(row.dnaCode, existingDna.dnaStructures[0].structureId);
          }
          continue;
        }

        const depKey = row.departement ? row.departement.trim().toLowerCase() : "";
        const depNumero = depKey ? (nameToNumero.get(depKey) ?? null) : null;
        if (!depNumero) {
          continue;
        }

        const regionCode = numeroToRegionCode.get(depNumero);
        if (!regionCode) {
          console.log(
            `⚠️ DNA ${row.dnaCode} ignoré: région introuvable pour département ${depNumero}`
          );
          continue;
        }

        const codeBhasile = await getNextBhasileCode(
          tx,
          regionCode,
          regionCounterCache
        );
        const cleanName = getCleanName(row, {
          departementNumero: depNumero,
          operateurClean: row.operateur,
        });
        const now = new Date();

        const createdStructure = await tx.structure.create({
          data: {
            codeBhasile,
            nom: cleanName,
            nomOfii: row.nom ?? undefined,
            type: row.type as StructureType,
            departementAdministratif: depNumero,
            directionTerritoriale: row.directionTerritoriale ?? undefined,
            activeInOfiiFileSince: now,
            inactiveInOfiiFileSince: null,
            operateurId: row.operateur
              ? (operateurMap.get(row.operateur) ?? null)
              : null,
          },
          select: { id: true },
        });

        const dna = existingDna
          ? existingDna
          : await tx.dna.create({
              data: {
                code: row.dnaCode,
                description: null,
              },
              select: { id: true },
            });

        await tx.dnaStructure.create({
          data: {
            dna: { connect: { id: dna.id } },
            structure: { connect: { id: createdStructure.id } },
            startDate: null,
            endDate: null,
          },
        });

        dnaToStructureId.set(row.dnaCode, createdStructure.id);
        structureIds.push(createdStructure.id);
        recordsByStructureId.set(createdStructure.id, [row]);
        representativeRows.push({ structureId: createdStructure.id, row });
        createdCount += 1;
      }

      for (const { structureId, row } of representativeRows) {
        const existing = structureById.get(structureId);
        const now = new Date();

        const depKey = row.departement
          ? row.departement.trim().toLowerCase()
          : "";
        const depNumero = depKey ? (nameToNumero.get(depKey) ?? null) : null;
        const cleanName = getCleanName(row, {
          departementNumero: depNumero,
          operateurClean: row.operateur,
        });
        await tx.structure.update({
          where: { id: structureId },
          data: {
            nom: cleanName,
            nomOfii: row.nom ?? undefined,
            type: row.type as StructureType,
            departementAdministratif: depNumero ?? undefined,
            directionTerritoriale: row.directionTerritoriale ?? undefined,
            inactiveInOfiiFileSince: null,
            activeInOfiiFileSince: existing?.activeInOfiiFileSince ?? now,
            operateurId: row.operateur
              ? (operateurMap.get(row.operateur) ?? null)
              : null,
          },
        });

        if (existing) {
          updatedCount += 1;
        }
      }

      const presentStructureIds = new Set(structureIds);
      const allActiveOfiiStructures = await tx.structure.findMany({
        where: { inactiveInOfiiFileSince: null },
        select: { id: true },
      });
      const structureIdsToDeactivate = allActiveOfiiStructures
        .map((s) => s.id)
        .filter((id) => !presentStructureIds.has(id));

      if (structureIdsToDeactivate.length > 0) {
        const deactivated = await tx.structure.updateMany({
          where: {
            id: { in: structureIdsToDeactivate },
            inactiveInOfiiFileSince: null,
          },
          data: { inactiveInOfiiFileSince: date },
        });
        console.log(
          `- ⚠️ ${deactivated.count} structures marquées comme inactives dans le fichier OFII (aucun DNA présent dans le XLSX).`
        );
      } else {
        console.log("- Aucune structure à désactiver.");
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
