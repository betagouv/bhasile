import prisma from "@/lib/prisma";
import {
  CpomApiWrite,
  CpomDepartementApiType,
  CpomStructureApiWrite,
} from "@/schemas/api/cpom.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import {
  CpomDbDetails,
  CpomDbList,
  cpomDetailsInclude,
  cpomListInclude,
} from "./cpom.db.type";

export const findAllCpoms = (): Promise<CpomDbList[]> =>
  prisma.cpom.findMany({ include: cpomListInclude });

export const findOne = async (id: number): Promise<CpomDbDetails | null> => {
  const cpom = await prisma.cpom.findFirst({
    where: { id },
    include: cpomDetailsInclude,
  });
  return cpom;
};

export const createOrUpdateCpom = async (
  cpom: CpomApiWrite
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

    await createOrUpdateDocumentsFinanciers(tx, cpom.documentsFinanciers, {
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
  structures: CpomStructureApiWrite[] | undefined,
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
