import z from "zod";

import { computeCpomDates } from "@/app/utils/cpom.util";
import { getYearRange } from "@/app/utils/date.util";
import {
  getRealCreationYear,
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
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
  const isAutorisee = isStructureAutorisee(structure.type);
  const isSubventionnee = isStructureSubventionnee(structure.type);

  const isInCpomPerYear = years.map(
    (year) =>
      structure.cpomStructures?.some((cpomStructure) => {
        const startYear = cpomStructure.dateStart
          ? new Date(cpomStructure.dateStart).getFullYear()
          : computeCpomDates(cpomStructure.cpom).dateStart
            ? new Date(computeCpomDates(cpomStructure.cpom).dateStart!).getFullYear()
            : undefined;
        const endYear = cpomStructure.dateEnd
          ? new Date(cpomStructure.dateEnd).getFullYear()
          : computeCpomDates(cpomStructure.cpom).dateEnd
            ? new Date(computeCpomDates(cpomStructure.cpom).dateEnd!).getFullYear()
            : undefined;
        return (
          startYear !== undefined &&
          endYear !== undefined &&
          startYear <= year &&
          endYear >= year
        );
      }) ?? false
  );

  const startYear = getRealCreationYear(structure);

  const schema = years
    .map((year, index) => {
      if (year < startYear) {
        return null;
      }

      if (isInCpomPerYear[index]) {
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
