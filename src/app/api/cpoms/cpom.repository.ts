import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Cpom, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  CpomApiType,
  CpomDepartementApiType,
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acteAdministratif.repository";

type SearchProps = {
  page?: number | null;
  departements: string | null;
  column?: CpomColumn | null;
  direction?: "asc" | "desc" | null;
};

const CPOM_ORDER_WITH_SQL = Prisma.sql`
  WITH
    cpom_start_dates AS (
      SELECT DISTINCT ON (aa."cpomId")
        aa."cpomId",
        aa."startDate" AS "dateStart"
      FROM public."ActeAdministratif" aa
      WHERE aa."cpomId" IS NOT NULL AND aa."startDate" IS NOT NULL
      ORDER BY aa."cpomId", aa.id ASC
    ),
    cpom_end_dates AS (
      SELECT
        aa."cpomId",
        MAX(aa."endDate") AS "dateEnd"
      FROM public."ActeAdministratif" aa
      WHERE aa."cpomId" IS NOT NULL AND aa."endDate" IS NOT NULL
      GROUP BY aa."cpomId"
    ),
    cpom_departements AS (
      SELECT
        cd."cpomId",
        STRING_AGG(d.numero, ', ' ORDER BY d.numero) AS departements
      FROM public."CpomDepartement" cd
      JOIN public."Departement" d ON d.id = cd."departementId"
      GROUP BY cd."cpomId"
    ),
    cpom_structures AS (
      SELECT
        cs."cpomId",
        COUNT(*)::int AS structures
      FROM public."CpomStructure" cs
      GROUP BY cs."cpomId"
    )
`;

const CPOM_ORDER_FROM_SQL = Prisma.sql`
  FROM public."Cpom" c
  LEFT JOIN public."Operateur" o ON o.id = c."operateurId"
  LEFT JOIN public."Region" r ON r.id = c."regionId"
  LEFT JOIN cpom_start_dates sd ON sd."cpomId" = c.id
  LEFT JOIN cpom_end_dates ed ON ed."cpomId" = c.id
  LEFT JOIN cpom_departements cd ON cd."cpomId" = c.id
  LEFT JOIN cpom_structures cs ON cs."cpomId" = c.id
`;

function buildOrder(column: CpomColumn, direction: "asc" | "desc"): Prisma.Sql {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<CpomColumn, Prisma.Sql> = {
    operateur: Prisma.sql`o.name`,
    structures: Prisma.sql`COALESCE(cs.structures, 0)`,
    granularity: Prisma.sql`c.granularity`,
    region: Prisma.sql`r.name`,
    departements: Prisma.sql`COALESCE(cd.departements, '')`,
    dateStart: Prisma.sql`sd."dateStart"`,
    dateEnd: Prisma.sql`ed."dateEnd"`,
  };
  return Prisma.sql`${byColumn[column]} ${dir}, c.id ASC`;
}

function buildWhereConditions({ departements }: SearchProps): Prisma.Sql {
  const departementList = departements?.split(",").filter(Boolean) ?? [];
  if (departementList.length === 0) {
    return Prisma.sql``;
  }
  const patterns = departementList.map((departement) => `%${departement}%`);
  return Prisma.sql`WHERE COALESCE(cd.departements, '') ILIKE ANY (ARRAY[${Prisma.join(patterns)}])`;
}

async function getCpomOrderIdsRaw({
  page,
  departements,
  column,
  direction,
}: SearchProps): Promise<{ id: number }[]> {
  const whereSql = buildWhereConditions({ page, departements, column, direction });
  const orderSql = buildOrder(column ?? "region", direction ?? "asc");
  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${CPOM_ORDER_WITH_SQL}
    SELECT c.id
    ${CPOM_ORDER_FROM_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ${DEFAULT_PAGE_SIZE}
    OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}
  `);
}

export const findBySearch = async ({
  page,
  departements,
  column,
  direction,
}: SearchProps): Promise<Cpom[]> => {
  const cpomOrderIds = await getCpomOrderIdsRaw({
    page,
    departements,
    column,
    direction,
  });

  if (cpomOrderIds.length === 0) {
    return [];
  }

  const cpoms = await prisma.cpom.findMany({
    where: {
      id: {
        in: cpomOrderIds.map((cpomOrder) => cpomOrder.id),
      },
    },
    include: {
      structures: true,
      cpomMillesimes: true,
      operateur: true,
      region: true,
      departements: {
        include: {
          departement: true,
        },
      },
      actesAdministratifs: {
        include: {
          fileUploads: true,
        },
      },
    },
  });

  const orderedCpoms = cpomOrderIds
    .map((cpomOrder) => cpoms.find((cpom) => cpom.id === cpomOrder.id))
    .filter((cpom) => cpom !== undefined);

  return orderedCpoms;
};

export const countBySearch = async ({
  departements,
}: SearchProps): Promise<number> => {
  const whereSql = buildWhereConditions({
    page: null,
    departements,
    column: null,
    direction: null,
  });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${CPOM_ORDER_WITH_SQL}
    SELECT COUNT(*)::bigint AS count
    ${CPOM_ORDER_FROM_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
};

export const findOne = async (id: number): Promise<Cpom> => {
  const cpom = await prisma.cpom.findFirstOrThrow({
    where: { id },
    include: {
      structures: {
        include: {
          structure: {
            select: {
              id: true,
              codeBhasile: true,
              type: true,
              communeAdministrative: true,
              operateur: {
                select: {
                  name: true,
                },
              },
              forms: true,
            },
          },
        },
      },
      cpomMillesimes: true,
      operateur: true,
      region: true,
      departements: {
        include: {
          departement: true,
        },
      },
      actesAdministratifs: {
        include: {
          fileUploads: true,
        },
      },
    },
  });
  return cpom;
};

export const createOrUpdateCpom = async (
  cpom: CpomApiType
): Promise<number> => {
  const operateurId = cpom.operateur?.id ?? cpom.operateurId;
  const cpomId = await prisma.$transaction(async (tx) => {
    let regionId: number | undefined;

    if (cpom.region) {
      const region = await tx.region.findFirst({
        where: { name: cpom.region?.name },
      });
      regionId = region?.id;
    }

    let cpomId = cpom.id;
    if (cpomId) {
      await tx.cpom.update({
        where: { id: cpom.id },
        data: {
          name: cpom.name,
          regionId,
          granularity: cpom.granularity,
          operateurId,
        },
      });
    } else {
      if (!operateurId) {
        throw new Error("Operateur ID is required when creating a new CPOM");
      }
      const upsertedCpom = await tx.cpom.create({
        data: {
          name: cpom.name,
          regionId,
          granularity: cpom.granularity,
          operateurId,
        },
      });
      cpomId = upsertedCpom.id;
    }

    await syncCpomDepartements(tx, cpom.departements, cpomId);

    await createOrUpdateCpomStructures(tx, cpom.structures, cpomId);

    await createOrUpdateCpomMillesimes(tx, cpom.cpomMillesimes, cpomId);

    await createOrUpdateActesAdministratifs(tx, cpom.actesAdministratifs, {
      cpomId,
    });

    return cpomId;
  });

  return cpomId;
};

const syncCpomDepartements = async (
  tx: PrismaTransaction,
  cpomDepartements: CpomDepartementApiType[] | undefined,
  cpomId: number
): Promise<void> => {
  if (!cpomDepartements) {
    return;
  }

  await tx.cpomDepartement.deleteMany({
    where: { cpomId },
  });

  const departementNumeros = cpomDepartements
    .map((departement) => departement.departement?.numero)
    .filter((numero): numero is string => numero !== undefined);

  if (!departementNumeros?.length) {
    return;
  }

  const departements = await tx.departement.findMany({
    where: { numero: { in: departementNumeros } },
    select: { id: true },
  });

  if (!departements.length) {
    return;
  }

  await tx.cpomDepartement.createMany({
    data: departements.map((departement) => ({
      cpomId,
      departementId: departement.id,
    })),
  });
};

const createOrUpdateCpomStructures = async (
  tx: PrismaTransaction,
  structures: CpomStructureApiType[] | undefined,
  cpomId: number
): Promise<void> => {
  if (!structures || structures.length === 0) {
    return;
  }

  await tx.cpomStructure.deleteMany({
    where: { cpomId },
  });

  await tx.cpomStructure.createMany({
    data: structures.map((structure) => ({
      cpomId,
      structureId: structure.structureId,
      dateStart: structure.dateStart,
      dateEnd: structure.dateEnd,
    })),
  });
};

export const createOrUpdateCpomMillesimes = async (
  tx: PrismaTransaction,
  millesimes: CpomMillesimeApiType[] | undefined,
  cpomId: number
): Promise<void> => {
  if (!millesimes || millesimes.length === 0) {
    return;
  }

  await Promise.all(
    millesimes.map(async (millesime) => {
      return tx.cpomMillesime.upsert({
        where: {
          cpomId_year: {
            cpomId,
            year: millesime.year,
          },
        },
        update: millesime,
        create: {
          cpomId,
          ...millesime,
        },
      });
    })
  );
};

export const deleteCpom = async (id: number): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("deleteCpom is only used in e2e tests");
  }
  await prisma.cpomMillesime.deleteMany({ where: { cpomId: id } });
  await prisma.cpom.delete({ where: { id } });
};
