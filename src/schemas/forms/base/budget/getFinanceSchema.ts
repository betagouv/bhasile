import z from "zod";

import { getYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import {
  AUTORISEE_OPEN_YEAR,
  CURRENT_YEAR,
  SUBVENTIONNEE_OPEN_YEAR,
} from "@/constants";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { FormKind } from "@/types/global";

import {
  budgetAutoriseeNotOpenSchema,
  budgetAutoriseeOpenSchema,
  budgetAutoriseeOpenYear1Schema,
  budgetAutoriseeOpenYear2Schema,
  budgetAutoSaveSchema,
  budgetInCpomSchema,
  budgetSubventionneeNotOpenSchema,
  budgetSubventionneeOpenSchema,
  budgetSubventionneeOpenYear1Schema,
} from "../budget.schema";
import { cpomStructureSchema } from "../cpom.schema";
import { DocumentsFinanciersFlexibleSchema } from "../documentFinancier.schema";
import { indicateursFinanciersSchema } from "../indicateurFinancier.schema";

export const getFinanceSchema = (
  structure: StructureApiRead,
  formKind: FormKind = FormKind.FINALISATION
) => {
  const { years } = getYearRange();
  const { isAutorisee, isSubventionnee } = structure;

  const startYear = getRealCreationYear(structure);

  const schema = years
    .map((year) => {
      if (year < startYear) {
        return null;
      }

      if (structure.isInCpomPerYear[year]) {
        return budgetInCpomSchema;
      }

      if (year === CURRENT_YEAR) {
        return budgetAutoSaveSchema;
      }

      if (isAutorisee) {
        if (year === CURRENT_YEAR) {
          return budgetAutoSaveSchema;
        }
        if (year === AUTORISEE_OPEN_YEAR) {
          return budgetAutoriseeOpenYear1Schema;
        }
        if (year === AUTORISEE_OPEN_YEAR - 1) {
          return budgetAutoriseeOpenYear2Schema;
        }
        if (year < AUTORISEE_OPEN_YEAR) {
          return budgetAutoriseeOpenSchema;
        }
        return budgetAutoriseeNotOpenSchema;
      }

      if (isSubventionnee) {
        if (year === SUBVENTIONNEE_OPEN_YEAR) {
          return budgetSubventionneeOpenYear1Schema;
        }
        if (year < SUBVENTIONNEE_OPEN_YEAR) {
          return budgetSubventionneeOpenSchema;
        }
        return budgetSubventionneeNotOpenSchema;
      }

      return budgetAutoSaveSchema;
    })
    .filter(Boolean) as [BudgetSchema, ...BudgetSchema[]];

  if (formKind === FormKind.FINALISATION) {
    return z
      .object({
        budgets: z.tuple(schema),
        cpomStructures: z.array(cpomStructureSchema),
      })
      .and(indicateursFinanciersSchema);
  }

  return z
    .object({
      budgets: z.tuple(schema),
      cpomStructures: z.array(cpomStructureSchema),
    })
    .and(indicateursFinanciersSchema)
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
