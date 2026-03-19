import { FinessApiType } from "@/schemas/api/finess.schema";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteFinesses = async (
  tx: PrismaTransaction,
  finessesToKeep: Partial<FinessApiType>[],
  structureId: number
): Promise<void> => {
  const everyFinessesOfStructure = await tx.finess.findMany({
    where: { structureId },
  });
  const finessesToDelete = everyFinessesOfStructure.filter(
    (finess) => !finessesToKeep.some((f) => f.id === finess.id)
  );
  await Promise.all(
    finessesToDelete.map((finess) =>
      tx.finess.delete({ where: { id: finess.id } })
    )
  );
};

export const createOrUpdateFinesses = async (
  tx: PrismaTransaction,
  finesses: Partial<FinessApiType>[] = [],
  structureId: number
): Promise<void> => {
  if (!finesses || finesses.length === 0) {
    return;
  }

  await deleteFinesses(tx, finesses, structureId);

  for (const finess of finesses) {
    if (!finess.code) {
      continue;
    }
    await tx.finess.upsert({
      where: { id: finess.id || 0 },
      update: {
        code: finess.code,
        description: finess.description,
      },
      create: {
        structureId,
        code: finess.code,
        description: finess.description,
      },
    });
  }
};
