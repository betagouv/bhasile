import prisma from "@/lib/prisma";

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
