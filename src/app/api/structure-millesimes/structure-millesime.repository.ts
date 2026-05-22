import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const getUniqueWhere = (
  entityId: EntityId,
  year: number
): { structureId_year: { structureId: number; year: number } } => {
  if (entityId.structureId === undefined) {
    throw new Error("structureId est requis pour un structureMillesime");
  }
  return {
    structureId_year: {
      structureId: entityId.structureId,
      year,
    },
  };
};

export const createOrUpdateStructureMillesimes = async (
  tx: PrismaTransaction,
  structureMillesimes: StructureMillesimeApiType[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!structureMillesimes || structureMillesimes.length === 0) {
    return;
  }

  await Promise.all(
    structureMillesimes.map((millesime) =>
      tx.structureMillesime.upsert({
        where: getUniqueWhere(entityId, millesime.year),
        update: millesime,
        create: {
          structureId: entityId.structureId,
          ...millesime,
        },
      })
    )
  );
};
