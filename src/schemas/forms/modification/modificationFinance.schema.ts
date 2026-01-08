import z from "zod";

import {
  autoriseeAvecCpomSchema,
  autoriseeSchema,
  basicSchema,
  subventionneeAvecCpomSchema,
  subventionneeSchema,
} from "@/schemas/forms/base/budget.schema.old";
import { DocumentsFinanciersFlexibleSchema } from "@/schemas/forms/base/documentFinancier.schema";

export const ModificationFinanceBasicSchema = basicSchema.and(
  DocumentsFinanciersFlexibleSchema
);

export const ModificationFinanceAutoriseeAvecCpomSchema =
  autoriseeAvecCpomSchema.and(DocumentsFinanciersFlexibleSchema);

export const ModificationFinanceAutoriseeSchema = autoriseeSchema.and(
  DocumentsFinanciersFlexibleSchema
);

export const ModificationFinanceSubventionneeAvecCpomSchema =
  subventionneeAvecCpomSchema.and(DocumentsFinanciersFlexibleSchema);

export const ModificationFinanceSubventionneeSchema = subventionneeSchema.and(
  DocumentsFinanciersFlexibleSchema
);

type ModificationFinanceBasicFormValues = z.infer<
  typeof ModificationFinanceBasicSchema
>;
type ModificationFinanceAutoriseeAvecCpomFormValues = z.infer<
  typeof ModificationFinanceAutoriseeAvecCpomSchema
>;
type ModificationFinanceAutoriseeFormValues = z.infer<
  typeof ModificationFinanceAutoriseeSchema
>;
type ModificationFinanceSubventionneeAvecCpomFormValues = z.infer<
  typeof ModificationFinanceSubventionneeAvecCpomSchema
>;
type ModificationFinanceSubventionneeFormValues = z.infer<
  typeof ModificationFinanceSubventionneeSchema
>;

export type anyModificationFinanceFormValues =
  | ModificationFinanceBasicFormValues
  | ModificationFinanceAutoriseeAvecCpomFormValues
  | ModificationFinanceAutoriseeFormValues
  | ModificationFinanceSubventionneeAvecCpomFormValues
  | ModificationFinanceSubventionneeFormValues;
