import z from "zod";

import { getYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import {
  AUTORISEE_OPEN_YEAR,
  CURRENT_YEAR,
  INDICATEUR_FINANCIER_CUTOFF_YEAR_AUTORISEE,
  INDICATEUR_FINANCIER_CUTOFF_YEAR_SUBVENTIONNEE,
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
} from "../budget.schema";
import { cpomStructureSchema } from "../cpom.schema";
import { DocumentsFinanciersFlexibleSchema } from "../documentFinancier.schema";
import { getIndicateursFinanciersSchema } from "../indicateurFinancier.schema";

export const getFinanceSchema = (
  structure: StructureApiRead,
  formKind: FormKind = FormKind.FINALISATION
) => {
  const { years } = getYearRange();
  const { isAutorisee, isSubventionnee } = structure;

  const indicateurCutoff = isAutorisee
    ? INDICATEUR_FINANCIER_CUTOFF_YEAR_AUTORISEE
    : INDICATEUR_FINANCIER_CUTOFF_YEAR_SUBVENTIONNEE;

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
        if (year <= SUBVENTIONNEE_OPEN_YEAR) {
          return budgetSubventionneeOpenSchema;
        }
        return budgetSubventionneeNotOpenSchema;
      }

      return budgetAutoSaveSchema;
    })
    .filter(Boolean) as [BudgetSchema, ...BudgetSchema[]];

  const budgets = z.tuple(schema) as unknown as z.ZodType<
    z.infer<BudgetSchema>[]
  >;

  if (formKind === FormKind.FINALISATION) {
    return z
      .object({
        budgets,
        cpomStructures: z.array(cpomStructureSchema),
      })
      .and(getIndicateursFinanciersSchema(indicateurCutoff));
  }

  return z
    .object({
      budgets,
      cpomStructures: z.array(cpomStructureSchema),
    })
    .and(getIndicateursFinanciersSchema(indicateurCutoff))
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
