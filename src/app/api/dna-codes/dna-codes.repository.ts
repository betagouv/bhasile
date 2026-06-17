import { Dna, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const findAll = async ({
  entityId = {},
  operateurId,
}: {
  entityId?: EntityId;
  operateurId?: number;
} = {}): Promise<{ code: string }[]> => {
  const { structureId, structureVersionId } = entityId;

  const ownershipFilters: Prisma.DnaWhereInput[] = [
    { dnaStructures: { none: {} } },
  ];
  if (structureId) {
    ownershipFilters.push({ dnaStructures: { some: { structureId } } });
  }
  if (structureVersionId) {
    ownershipFilters.push({
      dnaStructures: { some: { structureVersionId } },
    });
  }
  const structureFilter: Prisma.DnaWhereInput = { OR: ownershipFilters };

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
  dna: { code?: string | null } | undefined | null
): Promise<Dna | null> => {
  const normalizedCode = dna?.code?.trim();
  if (!normalizedCode) {
    return null;
  }

  return tx.dna.upsert({
    where: { code: normalizedCode },
    update: {},
    create: { code: normalizedCode },
  });
};
