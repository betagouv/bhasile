import z from "zod";

import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { FormKind } from "@/types/global";

import {
  budgetAutoriseeNotOpenSchema,
  budgetAutoriseeOpenSchema,
  budgetAutoriseeOpenYear1Schema,
  budgetAutoSaveSchema,
  budgetInCpomSchema,
  budgetSubventionneeNotOpenSchema,
  budgetSubventionneeOpenSchema,
} from "../budget.schema";
import { cpomStructureSchema } from "../cpom.schema";
import { DocumentsFinanciersFlexibleSchema } from "../documentFinancier.schema";

export const getFinanceSchema = (
  structure: StructureApiType,
  formKind: FormKind = FormKind.FINALISATION
) => {
  const { years } = getYearRange();
  const isAutorisee = isStructureAutorisee(structure.type);
  const isSubventionnee = isStructureSubventionnee(structure.type);

  const isInCpomPerYear = years.map((year) =>
    isStructureInCpom(structure, year)
  );

  const schema = years.map((year, index) => {
    if (isInCpomPerYear[index]) {
      return budgetInCpomSchema;
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

  if (formKind === FormKind.FINALISATION) {
    return z
      .object({
        budgets: z.tuple(schema),
      })
      .and(z.object({ cpomStructures: z.array(cpomStructureSchema) }));
  }

  return z
    .object({
      budgets: z.tuple(schema),
      cpomStructures: z.array(cpomStructureSchema),
    })
    .and(DocumentsFinanciersFlexibleSchema);
};

type BudgetSchema =
  | typeof budgetAutoSaveSchema
  | typeof budgetInCpomSchema
  | typeof budgetAutoriseeOpenYear1Schema
  | typeof budgetAutoriseeOpenSchema
  | typeof budgetAutoriseeNotOpenSchema
  | typeof budgetSubventionneeOpenSchema
  | typeof budgetSubventionneeNotOpenSchema;
