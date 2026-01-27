import { Cpom } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  CpomApiType,
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { PrismaTransaction } from "@/types/prisma.type";

export const findOne = async (id: number): Promise<Cpom> => {
  const cpom = await prisma.cpom.findFirstOrThrow({
    where: { id },
    include: {
      structures: true,
      cpomMillesimes: true,
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
        yearStart: cpom.yearStart,
        yearEnd: cpom.yearEnd,
        operateurId,
      },
      create: {
        name: cpom.name,
        yearStart: cpom.yearStart,
        yearEnd: cpom.yearEnd,
        operateurId: operateurId as number,
      },
    });

    const cpomId = upsertedCpom.id;

    await createOrUpdateCpomStructures(tx, cpom.structures, cpomId);

    await createOrUpdateCpomMillesimes(tx, cpom.cpomMillesimes, cpomId);

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
      yearStart: structure.yearStart ?? null,
      yearEnd: structure.yearEnd ?? null,
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
