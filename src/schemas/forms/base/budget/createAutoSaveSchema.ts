import { z } from "zod";

import { zSafeDecimalsNullish, zSafeYear } from "@/app/utils/zodCustomFields";

import {
  budgetAutoriseeOpenSchemaWithoutRefinement,
  budgetSubventionneeOpenSchema,
} from "../budget.schema";

export const createAutoSaveSchema = () => {
  const autoriseeShape = budgetAutoriseeOpenSchemaWithoutRefinement.shape;
  const subventionneeShape = budgetSubventionneeOpenSchema.shape;

  const allKeys = new Set([
    ...Object.keys(autoriseeShape),
    ...Object.keys(subventionneeShape),
  ]);

  const schemaObject: Record<string, z.ZodTypeAny> = {};

  for (const key of allKeys) {
    if (key === "year") {
      schemaObject[key] = zSafeYear();
    } else if (key === "id") {
      schemaObject[key] = z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.number().optional()
      );
    } else if (key === "commentaire") {
      schemaObject[key] = z.string().nullish();
    } else {
      schemaObject[key] = zSafeDecimalsNullish();
    }
  }

  return z.object(schemaObject);
};
