import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma, Structure, StructureType } from "@/generated/prisma/client";
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
import {
  currentVersionWhere,
  StructureVersionDbDetails,
} from "../structure-versions/structure-version.db.type";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
import {
  buildCurrentVersionCteSql,
  buildStructuresOrderCteSql,
  STRUCTURES_ORDER_JOINS_SQL,
} from "./structure.constants";
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
  buildStructuresOrderSql,
  buildStructuresWhereSql,
} from "./structure.util";

const getOrderedStructures = async (
  {
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
    column,
    direction,
    selection,
    finalised,
    map,
  }: SearchProps,
  now: Date
): Promise<{ id: number }[]> => {
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
    selection,
    finalised,
  });
  const orderSql = buildStructuresOrderSql(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );
  const paginationSql =
    selection || map
      ? Prisma.sql``
      : Prisma.sql`LIMIT ${DEFAULT_PAGE_SIZE} OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}`;

  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${buildStructuresOrderCteSql(now)}
    SELECT s.id
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    ${paginationSql}
  `);
};

export const findBySearch = async ({
  search,
  page,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
  column,
  direction,
  map,
  selection,
  finalised,
}: SearchProps): Promise<StructureDbList[] | StructureDbMap[]> => {
  const now = new Date();
  const structuresIds = await getOrderedStructures(
    {
      search,
      page,
      type,
      bati,
      placesAutorisees,
      departements,
      operateurs,
      column,
      direction,
      map,
      selection,
      finalised,
    },
    now
  );
  const ids = structuresIds.map((structure) => structure.id);

  if (map) {
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

export const countBySearch = async ({
  search,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
}: SearchProps): Promise<number> => {
  const now = new Date();
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    selection: false,
  });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${buildStructuresOrderCteSql(now)}
    SELECT COUNT(*)::bigint AS count
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
};

export const getLatestPlacesAutoriseesPerStructure = async (): Promise<
  number[]
> => {
  const now = new Date();
  const rows = await prisma.$queryRaw<{ placesAutorisees: number | null }[]>(
    Prisma.sql`
      WITH ${buildCurrentVersionCteSql(now)}
      SELECT DISTINCT ON (cv."structureId")
        st."placesAutorisees" AS "placesAutorisees"
      FROM current_version cv
      JOIN public."StructureTypologie" st ON st."structureVersionId" = cv.version_id
      WHERE st."placesAutorisees" IS NOT NULL
      ORDER BY cv."structureId", st."year" DESC
    `
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

export const VERSIONED_FIELD_KEYS = [
  "type",
  "public",
  "adresseAdministrative",
  "codePostalAdministratif",
  "communeAdministrative",
  "departementAdministratif",
  "latitude",
  "longitude",
  "nom",
  "creationDate",
  "date303",
  "lgbt",
  "fvvTeh",
  "notes",
  "nomOfii",
  "directionTerritoriale",
  "contacts",
  "adresses",
  "antennes",
  "structureFinesses",
  "dnaStructures",
  "structureTypologies",
] as const satisfies readonly (keyof StructureAgentUpdateApiType &
  keyof StructureVersionDbDetails)[];

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
export const deleteStructure = async (codeBhasile: string): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.delete({ where: { codeBhasile } });
};
