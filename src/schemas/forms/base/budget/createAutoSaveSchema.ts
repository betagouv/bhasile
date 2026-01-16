import { z } from "zod";

import { zSafeDecimalsNullish, zSafeYear } from "@/app/utils/zodCustomFields";

import {
  budgetAutoriseeOpenSchemaWithoutRefinement,
  budgetSubventionneeOpenSchema,
} from "../budget.schema";

export const createAutoSaveSchema = () => {
  // Merge both schemas to get all fields
  const merged = budgetAutoriseeOpenSchemaWithoutRefinement.merge(
    budgetSubventionneeOpenSchema
  );

  // Get all field names from the merged schema
  const allFieldNames = Object.keys(merged.shape) as Array<
    keyof typeof merged.shape
  >;

  // Build a new schema object where all decimal fields are nullish
  // but we derive the field list from the merged schema to avoid duplication
  const autoSaveFields = allFieldNames.reduce(
    (acc, fieldName) => {
      if (fieldName === "year") {
        acc[fieldName] = zSafeYear();
      } else if (fieldName === "id") {
        acc[fieldName] = z.preprocess(
          (val) => (val === "" ? undefined : val),
          z.number().optional()
        );
      } else if (fieldName === "commentaire") {
        acc[fieldName] = z.string().nullish();
      } else {
        // All other fields (decimal fields) should be nullish
        acc[fieldName] = zSafeDecimalsNullish();
      }
      return acc;
    },
    {} as Record<string, z.ZodTypeAny>
  );

  return z.object(autoSaveFields);
};
