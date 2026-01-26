import { Cpom } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  CpomApiType,
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { findMatchingCpomForMillesime } from "./cpom.service";

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
  if (!cpom.operateur.id) {
    throw new Error("Operateur ID is required");
  }

  const cpomId = await prisma.$transaction(async (tx) => {
    const upsertedCpom = await tx.cpom.upsert({
      where: { id: cpom.id ?? 0 },
      update: {
        name: cpom.name,
        yearStart: cpom.yearStart,
        yearEnd: cpom.yearEnd,
        operateur: {
          connect: { id: cpom.operateur.id },
        },
      },
      create: {
        name: cpom.name,
        yearStart: cpom.yearStart,
        yearEnd: cpom.yearEnd,
        operateur: {
          connect: { id: cpom.operateur.id },
        },
      },
    });

    const cpomId = upsertedCpom.id;

    await createOrUpdateCpomStructures(tx, cpom.structures, cpomId);

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
  structureDnaCode: string
): Promise<void> => {
  if (!millesimes || millesimes.length === 0) {
    return;
  }

  const structure = await tx.structure.findUnique({
    where: { dnaCode: structureDnaCode },
    select: { id: true },
  });

  if (!structure) {
    throw new Error(
      `Structure avec le code DNA ${structureDnaCode} non trouvée`
    );
  }

  const cpomStructures = await tx.cpomStructure.findMany({
    where: { structureId: structure.id },
    include: {
      cpom: {
        select: {
          id: true,
          yearStart: true,
          yearEnd: true,
        },
      },
    },
  });

  if (cpomStructures.length === 0) {
    console.warn(
      `Aucun CPOM associé à la structure ${structureDnaCode}, millésimes ignorés`
    );
    return;
  }

  await Promise.all(
    millesimes.map(async (millesime) => {
      const resolved = findMatchingCpomForMillesime(cpomStructures, millesime);

      if (!resolved) {
        console.warn(
          `Aucun CPOM trouvé pour la structure ${structureDnaCode} avec une période couvrant l'année ${millesime.year}, millésime ignoré`
        );
        return;
      }

      const { cpomId, year } = resolved;

      return tx.cpomMillesime.upsert({
        where: {
          cpomId_year: {
            cpomId,
            year,
          },
        },
        update: millesime,
        create: {
          cpomId,
          ...millesime,
          year,
        },
      });
    })
  );
};
