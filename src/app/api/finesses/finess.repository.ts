import { FinessApiType } from "@/schemas/api/finess.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteFinesses = async (
  tx: PrismaTransaction,
  finessesToKeep: Partial<FinessApiType>[],
  entityId: EntityId
): Promise<void> => {
  const everyFinessesOfEntity = await tx.finess.findMany({
    where: entityId,
  });
  const finessesToDelete = everyFinessesOfEntity.filter(
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
  entityId: EntityId
): Promise<void> => {
  if (!finesses || finesses.length === 0) {
    return;
  }

  await deleteFinesses(tx, finesses, entityId);

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
        ...entityId,
        code: finess.code,
        description: finess.description,
      },
    });
  }
};
