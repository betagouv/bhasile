import { Structure, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateControles } from "../controles/controle.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
import {
  createOrUpdateForms,
  initializeStructureDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateIndicateursFinanciers } from "../indicateurs-financiers/indicateur-financier.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { currentVersionWhere } from "../structure-versions/structure-version.db.type";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
import { VERSIONED_FIELD_KEYS } from "./structure.constants";
import {
  StructureDbList,
  StructureDbMap,
  StructureDbOperateur,
  structureDetailsInclude,
  structureListInclude,
  structureListVersionInclude,
  structureOperateurSelect,
} from "./structure.db.type";
import { SearchProps } from "./structure.service";
import {
  buildCountStructuresQuery,
  buildLatestPlacesAutoriseesQuery,
  buildOrderedStructureIdsQuery,
} from "./structure.sql";

const getOrderedStructures = async (
  props: SearchProps,
  now: Date
): Promise<{ id: number }[]> =>
  prisma.$queryRaw<{ id: number }[]>(buildOrderedStructureIdsQuery(props, now));

export const findBySearch = async (
  props: SearchProps,
  now: Date
): Promise<StructureDbList[] | StructureDbMap[]> => {
  const structuresIds = await getOrderedStructures(props, now);
  const ids = structuresIds.map((structure) => structure.id);

  if (props.map) {
    const mapStructures = await prisma.structure.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        structureVersions: {
          where: currentVersionWhere(now),
          orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
          take: 1,
          select: { latitude: true, longitude: true },
        },
      },
    });
    return mapStructures.map((structure) => ({
      id: structure.id,
      latitude: structure.structureVersions[0]?.latitude ?? null,
      longitude: structure.structureVersions[0]?.longitude ?? null,
    }));
  }

  const structures = await prisma.structure.findMany({
    where: { id: { in: ids } },
    include: {
      ...structureListInclude,
      structureVersions: {
        where: currentVersionWhere(now),
        orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
        take: 1,
        include: structureListVersionInclude,
      },
    },
  });

  const orderedStructures = structuresIds
    .map((orderedId) =>
      structures.find((structure) => structure.id === orderedId.id)
    )
    .filter((structure) => structure !== undefined);

  return orderedStructures;
};

export const countBySearch = async (
  props: SearchProps,
  now: Date
): Promise<number> => {
  const result = await prisma.$queryRaw<{ count: bigint }[]>(
    buildCountStructuresQuery(props, now)
  );
  return Number(result[0]?.count ?? 0);
};

export const getLatestPlacesAutoriseesPerStructure = async (
  now: Date
): Promise<number[]> => {
  const rows = await prisma.$queryRaw<{ placesAutorisees: number | null }[]>(
    buildLatestPlacesAutoriseesQuery(now)
  );

  return rows
    .map((row) => row.placesAutorisees)
    .filter((placesAutorisees): placesAutorisees is number => placesAutorisees !== null);
};

export const findOneOperateur = async (
  id: number
): Promise<StructureDbOperateur> => {
  return await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: structureOperateurSelect,
  });
};

export const findStructureDepartement = async (
  id: number
): Promise<{ departementAdministratif: string | null }> => {
  return await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: { departementAdministratif: true },
  });
};

export const findOne = async (id: number) => {
  const structure = await prisma.structure.findFirstOrThrow({
    where: {
      id,
    },
    include: structureDetailsInclude,
  });
  return structure;
};

const hasVersionedFields = (structure: StructureAgentUpdateApiType): boolean =>
  VERSIONED_FIELD_KEYS.some((key) => structure[key] !== undefined);

const writeRollingVersion = async (
  tx: PrismaTransaction,
  structure: StructureAgentUpdateApiType
): Promise<void> => {
  if (!hasVersionedFields(structure)) {
    return;
  }

  const rollingVersion = await tx.structureVersion.findFirst({
    where: {
      structureId: structure.id,
      structureVersionTransformationId: null,
      forceHistorize: false,
    },
    orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
    select: { id: true },
  });

  const versionedData = Object.fromEntries(
    VERSIONED_FIELD_KEYS.map((key) => [key, structure[key]])
  ) as Pick<StructureAgentUpdateApiType, (typeof VERSIONED_FIELD_KEYS)[number]>;

  const versionPayload: StructureVersionApiType = {
    id: rollingVersion?.id,
    structureId: structure.id,
    effectiveDate: new Date().toISOString(),
    ...versionedData,
  };

  await createOrUpdateStructureVersion(tx, versionPayload, {
    structureId: structure.id,
  });
};

export const updateOne = async (
  structure: StructureAgentUpdateApiType,
  isOperateurUpdate: boolean = false
): Promise<Structure> => {
  try {
    const {
      budgets,
      indicateursFinanciers,
      actesAdministratifs,
      documentsFinanciers,
      controles,
      evaluations,
      forms,
      structureMillesimes,
    } = structure;

    return await prisma.$transaction(
      async (tx) => {
        const updatedStructure = await updateStructure(tx, structure);

        await initializeStructureDefaultForms(
          tx,
          isOperateurUpdate,
          structure.id
        );

        await writeRollingVersion(tx, structure);
        await createOrUpdateBudgets(tx, budgets, { structureId: structure.id });
        await createOrUpdateIndicateursFinanciers(tx, indicateursFinanciers, {
          structureId: structure.id,
        });
        await createOrUpdateActesAdministratifs(tx, actesAdministratifs, {
          structureId: structure.id,
        });
        await createOrUpdateDocumentsFinanciers(tx, documentsFinanciers, {
          structureId: structure.id,
        });
        await createOrUpdateControles(tx, controles, structure.id);
        await createOrUpdateForms(tx, forms, { structureId: structure.id });
        await createOrUpdateEvaluations(tx, evaluations, structure.id);
        await createOrUpdateStructureMillesimes(tx, structureMillesimes, {
          structureId: structure.id,
        });

        return updatedStructure;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );
  } catch (error) {
    throw new Error(
      `Impossible de mettre à jour la structure avec l'id ${structure.id}: ${error}`
    );
  }
};

const updateStructure = async (
  tx: PrismaTransaction,
  structure: StructureAgentUpdateApiType
): Promise<Structure> => {
  const { operateur, filiale } = structure;

  const updatedStructure = await tx.structure.update({
    where: {
      id: structure.id,
    },
    data: {
      filiale,
      operateur: {
        connect: operateur
          ? {
              id: operateur?.id,
            }
          : undefined,
      },
    },
  });
  return updatedStructure;
};

// Only used in e2e tests
export const createMinimalStructure = async (
  dnaCodes: { code: string }[],
  structure: {
    codeBhasile: string;
    type: StructureType;
    operateurId: number;
    departementAdministratif?: string;
    nom: string;
    adresseAdministrative: string;
    codePostalAdministratif: string;
    communeAdministrative: string;
  }
): Promise<Structure> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }

  const upsertedStructure = await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
    create: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
  });

  return upsertedStructure;
};

// Only used in e2e tests
export const createMinimalStructureVersion = async (
  structureId: number,
  version: {
    type: StructureType;
    departementAdministratif?: string;
    communeAdministrative?: string;
    codePostalAdministratif?: string;
    adresseAdministrative?: string;
    nom?: string;
    effectiveDate?: Date;
  }
): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }

  await prisma.structureVersion.deleteMany({
    where: { structureId, structureVersionTransformationId: null },
  });

  await prisma.structureVersion.create({
    data: {
      structureId,
      effectiveDate: version.effectiveDate ?? new Date("2020-01-01"),
      type: version.type,
      departementAdministratif: version.departementAdministratif,
      communeAdministrative: version.communeAdministrative,
      codePostalAdministratif: version.codePostalAdministratif,
      adresseAdministrative: version.adresseAdministrative,
      nom: version.nom,
    },
  });
};

// Only used in e2e tests
export const deleteStructure = async (codeBhasile: string): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.delete({ where: { codeBhasile } });
};
