import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

const getUniqueWhere = (
  entityId: EntityId,
  year: number
):
  | { structureId_year: { structureId: number; year: number } }
  | {
      structureTransformationId_year: {
        structureTransformationId: number;
        year: number;
      };
    } => {
  if (entityId.structureId !== undefined) {
    return {
      structureId_year: {
        structureId: entityId.structureId,
        year,
      },
    };
  }
  if (entityId.structureTransformationId !== undefined) {
    return {
      structureTransformationId_year: {
        structureTransformationId: entityId.structureTransformationId,
        year,
      },
    };
  }
  throw new Error(
    "structureId ou structureTransformationId est requis pour un structureMillesime"
  );
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
          ...entityId,
          ...millesime,
        },
      })
    )
  );
};
