import z from "zod";

import { controlesSchema } from "../base/controle.schema";
import { evaluationsSchemaWithConditionalValidation } from "../base/evaluation.schema";

export const modificationQualiteSchema = controlesSchema.and(
  evaluationsSchemaWithConditionalValidation.optional()
);

export type ModificationQualiteFormValues = z.infer<
  typeof modificationQualiteSchema
>;
