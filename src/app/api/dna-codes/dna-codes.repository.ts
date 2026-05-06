import { Dna } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { PrismaTransaction } from "@/types/prisma.type";

export const findAll = async ({
  structureId,
}: {
  structureId: number;
}): Promise<{ code: string }[]> => {
  return prisma.dna.findMany({
    where: {
      OR: [
        { dnaStructures: { none: {} } },
        { dnaStructures: { some: { structureId } } },
      ],
    },
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
