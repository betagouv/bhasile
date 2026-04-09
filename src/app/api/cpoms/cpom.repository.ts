import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Cpom } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  CpomApiType,
  CpomDepartementApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { CpomColumn } from "@/types/ListColumn";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acteAdministratif.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { CPOM_ORDER_CTE_SQL, CPOM_ORDER_JOINS_SQL } from "./cpom.constants";
import { buildCpomsOrderSql, buildCpomsWhereSql } from "./cpom.util";

type SearchProps = {
  page?: number | null;
  departements: string | null;
  column?: CpomColumn | null;
  direction?: "asc" | "desc" | null;
};

async function getOrderedCpoms({
  page,
  departements,
  column,
  direction,
}: SearchProps): Promise<{ id: number }[]> {
  const whereSql = buildCpomsWhereSql({ departements });
  const orderSql = buildCpomsOrderSql(column ?? "region", direction ?? "asc");
  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${CPOM_ORDER_CTE_SQL}
    SELECT c.id
    ${CPOM_ORDER_JOINS_SQL}
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
  const cpomOrderIds = await getOrderedCpoms({
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
      budgets: true,
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

export async function countBySearch({
  departements,
}: SearchProps): Promise<number> {
  const whereSql = buildCpomsWhereSql({ departements });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${CPOM_ORDER_CTE_SQL}
    SELECT COUNT(*)::bigint AS count
    ${CPOM_ORDER_JOINS_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
}

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
      budgets: true,
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

    await createOrUpdateBudgets(tx, cpom.budgets, { cpomId });

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

export const deleteCpom = async (id: number): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("deleteCpom is only used in e2e tests");
  }
  await prisma.cpomMillesime.deleteMany({ where: { cpomId: id } });
  await prisma.cpom.delete({ where: { id } });
};
