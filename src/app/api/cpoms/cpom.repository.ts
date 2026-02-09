import { Cpom } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  CpomApiType,
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { updateFileUploads } from "../files/file.repository";

export const findAll = async (): Promise<Cpom[]> => {
  return prisma.cpom.findMany({
    include: {
      structures: true,
      cpomMillesimes: true,
      operateur: true,
      actesAdministratifs: true,
    },
  });
};

export const countAll = async (): Promise<number> => {
  return prisma.cpom.count();
};

export const findOne = async (id: number): Promise<Cpom> => {
  const cpom = await prisma.cpom.findFirstOrThrow({
    where: { id },
    include: {
      structures: true,
      cpomMillesimes: true,
      operateur: true,
      actesAdministratifs: true,
    },
  });
  return cpom;
};

export const createOrUpdateCpom = async (
  cpom: CpomApiType
): Promise<number> => {
  const operateurId = cpom.operateur?.id ?? cpom.operateurId;
  const cpomId = await prisma.$transaction(async (tx) => {
    const upsertedCpom = await tx.cpom.upsert({
      where: { id: cpom.id ?? 0 },
      update: {
        name: cpom.name,
        operateurId,
        region: cpom.region,
        departements: cpom.departements ?? [],
        granularity: cpom.granularity,
      },
      create: {
        name: cpom.name,
        operateurId: operateurId as number,
        region: cpom.region,
        departements: cpom.departements ?? [],
        granularity: cpom.granularity,
      },
    });

    const cpomId = upsertedCpom.id;

    await createOrUpdateCpomStructures(tx, cpom.structures, cpomId);

    await createOrUpdateCpomMillesimes(tx, cpom.cpomMillesimes, cpomId);

    await updateFileUploads(
      tx,
      cpom.actesAdministratifs,
      { cpomId },
      "acteAdministratif"
    );

    return cpomId;
  });

  return cpomId;
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
