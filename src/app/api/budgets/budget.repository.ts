import { BudgetApiType } from "@/schemas/api/budget.schema";
import { OwnerId } from "@/types/Owner.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const createOrUpdateBudgets = async (
  tx: PrismaTransaction,
  budgets: BudgetApiType[] | undefined,
  ownerId: OwnerId
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

const getWhere = (ownerId: OwnerId, budget: BudgetApiType) => {
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
    "Either structure ID or CPOM ID + structure type is required when creating a new budget"
  );
};
