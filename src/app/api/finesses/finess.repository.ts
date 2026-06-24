import { Finess, Prisma } from "@/generated/prisma/client";
import { StructureFinessApiType } from "@/schemas/api/finess.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const buildStructureFinessWhere = (
  structureFinessId: number | undefined,
  entityId: EntityId,
  finessId: number
): Prisma.StructureFinessWhereUniqueInput => {
  if (structureFinessId) {
    return { id: structureFinessId };
  }
  if (entityId.structureVersionId != null) {
    return {
      structureVersionId_finessId: {
        structureVersionId: entityId.structureVersionId,
        finessId,
      },
    };
  }
  if (entityId.structureId != null) {
    return {
      structureId_finessId: { structureId: entityId.structureId, finessId },
    };
  }
  return { id: 0 };
};

const deleteStructureFinesses = async (
  tx: PrismaTransaction,
  structureFinessesToKeep: Partial<StructureFinessApiType>[],
  entityId: EntityId
): Promise<void> => {
  const everyStructureFinessesOfEntity = await tx.structureFiness.findMany({
    where: entityId,
  });
  const structureFinessesToDelete = everyStructureFinessesOfEntity.filter(
    (structureFiness) =>
      !structureFinessesToKeep.some(
        (structureFinessToKeep) =>
          structureFinessToKeep.id === structureFiness.id
      )
  );
  await Promise.all(
    structureFinessesToDelete.map((structureFiness) =>
      tx.structureFiness.delete({ where: { id: structureFiness.id } })
    )
  );
};

const upsertFiness = async (
  tx: PrismaTransaction,
  finess: { code?: string | null } | undefined | null
): Promise<Finess | null> => {
  const normalizedCode = finess?.code?.trim();
  if (!normalizedCode) {
    return null;
  }

  return tx.finess.upsert({
    where: { code: normalizedCode },
    update: {},
    create: { code: normalizedCode },
  });
};

export const createOrUpdateStructureFinesses = async (
  tx: PrismaTransaction,
  structureFinesses: Partial<StructureFinessApiType>[] = [],
  entityId: EntityId
): Promise<void> => {
  if (!structureFinesses || structureFinesses.length === 0) {
    return;
  }

  await deleteStructureFinesses(tx, structureFinesses, entityId);

  for (const structureFiness of structureFinesses) {
    const upsertedFiness = await upsertFiness(tx, structureFiness.finess);
    if (!upsertedFiness) {
      continue;
    }

    await tx.structureFiness.upsert({
      where: buildStructureFinessWhere(
        structureFiness.id,
        entityId,
        upsertedFiness.id
      ),
      update: {
        finessId: upsertedFiness.id,
        description: structureFiness.description,
      },
      create: {
        ...entityId,
        finessId: upsertedFiness.id,
        description: structureFiness.description,
      },
    });
  }
};
