import z from "zod";

import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { StructureApiType } from "@/schemas/api/structure.schema";

import {
  budgetAutoriseeNotOpenSchema,
  budgetAutoriseeOpenSchema,
  budgetAutoriseeOpenYear1Schema,
  budgetAutoSaveSchema,
  budgetSubventionneeNotOpenSchema,
  budgetSubventionneeOpenSchema,
} from "../budget.schema";

type BudgetSchema =
  | typeof budgetAutoSaveSchema
  | typeof budgetAutoriseeOpenYear1Schema
  | typeof budgetAutoriseeOpenSchema
  | typeof budgetAutoriseeNotOpenSchema
  | typeof budgetSubventionneeOpenSchema
  | typeof budgetSubventionneeNotOpenSchema;

export const getFinanceSchema = (structure: StructureApiType) => {
  const { years } = getYearRange();
  const isAutorisee = isStructureAutorisee(structure.type);
  const isSubventionnee = isStructureSubventionnee(structure.type);

  const isInCpomPerYear = years.map((year) =>
    isStructureInCpom(structure, year)
  );

  const schema = years.map((year, index) => {
    if (isInCpomPerYear[index]) {
      return budgetAutoSaveSchema;
    }

    if (isAutorisee) {
      if (year === AUTORISEE_OPEN_YEAR) {
        return budgetAutoriseeOpenYear1Schema;
      }
      if (year < AUTORISEE_OPEN_YEAR) {
        return budgetAutoriseeOpenSchema;
      }
      return budgetAutoriseeNotOpenSchema;
    }

    if (isSubventionnee) {
      if (year <= SUBVENTIONNEE_OPEN_YEAR) {
        return budgetSubventionneeOpenSchema;
      } else {
        return budgetSubventionneeNotOpenSchema;
      }
    }

    return budgetAutoSaveSchema;
  }) as [BudgetSchema, ...BudgetSchema[]];

  return z.object({
    budgets: z.tuple(schema),
  });
};
