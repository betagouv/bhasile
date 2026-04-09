import { BudgetApiType } from "@/schemas/api/budget.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateBudgets = async (
  tx: PrismaTransaction,
  budgets: BudgetApiType[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!budgets || budgets?.length === 0) {
    return;
  }

  await Promise.all(
    (budgets || []).map((budget) => {
      return tx.budget.upsert({
        where: getWhere(entityId, budget),
        update: budget,
        create: {
          ...entityId,
          ...budget,
        },
      });
    })
  );
};

const getWhere = (entityId: EntityId, budget: BudgetApiType) => {
  if (entityId.structureId !== undefined) {
    return {
      structureId_year: {
        structureId: entityId.structureId,
        year: budget.year,
      },
    };
  }
  if (entityId.cpomId !== undefined && budget.cpomStructureType !== undefined) {
    return {
      cpomId_year_cpomStructureType: {
        cpomId: entityId.cpomId,
        year: budget.year,
        cpomStructureType: budget.cpomStructureType,
      },
    };
  }
  throw new Error(
    "Soit structureID, soit cpomId + cpomStructureType sont requis lors de la création d'un budget"
  );
};
