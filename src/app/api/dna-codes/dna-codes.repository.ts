import prisma from "@/lib/prisma";

export const findAll = async ({
  free,
  structureId,
}: {
  free: boolean;
  structureId: number;
}): Promise<{ code: string }[]> => {
  const where = free
    ? {
        OR: [
          { dnaStructures: { none: {} } },
          { dnaStructures: { some: { structureId } } },
        ],
      }
    : { dnaStructures: { some: { structureId } } };

  return prisma.dna.findMany({ where, select: { code: true } });
};
