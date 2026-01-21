import z from "zod";

import { DocumentsFinanciersFlexibleSchema } from "@/schemas/forms/base/documentFinancier.schema";

import {
  budgetAutoriseeNotOpenSchema,
  budgetAutoriseeOpenSchema,
  budgetAutoriseeOpenYear1Schema,
  budgetAutoSaveSchema,
  budgetSubventionneeNotOpenSchema,
  budgetSubventionneeOpenSchema,
} from "../base/budget.schema";
import { cpomStructureSchema } from "../base/cpomStructure.schema";

type BudgetSchema =
  | z.infer<typeof budgetAutoriseeNotOpenSchema>
  | z.infer<typeof budgetAutoriseeOpenYear1Schema>
  | z.infer<typeof budgetAutoriseeOpenSchema>
  | z.infer<typeof budgetSubventionneeNotOpenSchema>
  | z.infer<typeof budgetSubventionneeOpenSchema>
  | z.infer<typeof budgetAutoSaveSchema>;

export type anyModificationFinanceFormValues = {
  budgets: BudgetSchema[];
} & z.infer<typeof cpomStructureSchema> &
  z.infer<typeof DocumentsFinanciersFlexibleSchema>;
