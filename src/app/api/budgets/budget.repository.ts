import { BudgetApiType } from "@/schemas/api/budget.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateBudgets = async (
  tx: PrismaTransaction,
  budgets: BudgetApiType[] | undefined,
  ownerId: EntityId
): Promise<void> => {
  if (!budgets || budgets?.length === 0) {
    return;
  }

  await Promise.all(
    (budgets || []).map((budget) => {
      return tx.budget.upsert({
        where: getWhere(ownerId, budget),
        update: budget,
        create: {
          ...ownerId,
          ...budget,
        },
      });
    })
  );
};

const getWhere = (ownerId: EntityId, budget: BudgetApiType) => {
  if (ownerId.structureId !== undefined) {
    return {
      structureId_year: { structureId: ownerId.structureId, year: budget.year },
    };
  }
  if (ownerId.cpomId !== undefined && budget.cpomStructureType !== undefined) {
    return {
      cpomId_year_cpomStructureType: {
        cpomId: ownerId.cpomId,
        year: budget.year,
        cpomStructureType: budget.cpomStructureType,
      },
    };
  }
  throw new Error(
    "Soit structureID, soit cpomId + cpomStructureType sont requis lors de la création d'un budget"
  );
};
