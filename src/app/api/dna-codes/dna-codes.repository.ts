import { Dna } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { PrismaTransaction } from "@/types/prisma.type";

export const findAll = async ({
  structureId,
  operateurId,
}: {
  structureId?: number;
  operateurId?: number;
}): Promise<{ code: string }[]> => {
  const structureFilter = structureId
    ? {
        OR: [
          { dnaStructures: { none: {} } },
          { dnaStructures: { some: { structureId } } },
        ],
      }
    : { dnaStructures: { none: {} } };

  const operateurFilter =
    operateurId !== undefined
      ? { OR: [{ operateurId }, { operateurId: null }] }
      : null;

  return prisma.dna.findMany({
    where: operateurFilter
      ? { AND: [structureFilter, operateurFilter] }
      : structureFilter,
    select: { code: true },
  });
};

export const upsertDna = async (
  tx: PrismaTransaction,
  dna: { code?: string | null; description?: string | null } | undefined | null
): Promise<Dna | null> => {
  const normalizedCode = dna?.code?.trim();
  if (!normalizedCode) {
    return null;
  }

  return tx.dna.upsert({
    where: { code: normalizedCode },
    update: { description: dna?.description },
    create: { code: normalizedCode, description: dna?.description },
  });
};
