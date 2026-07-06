import z from "zod";

import { controlesAutoSaveSchema } from "../base/controle.schema";
import {
  evaluationsAutoSaveSchema,
  evaluationsSchemaWithConditionalValidation,
} from "../base/evaluation.schema";
import { structureTypologiesAutoSaveSchema } from "../base/structureTypologie.schema";

export const finalisationQualiteSchema = controlesAutoSaveSchema.and(
  evaluationsSchemaWithConditionalValidation
);

export const finalisationQualiteAutoSaveSchema = controlesAutoSaveSchema
  .and(evaluationsAutoSaveSchema)
  .and(structureTypologiesAutoSaveSchema);

export type FinalisationQualiteFormValues = z.infer<
  typeof finalisationQualiteSchema
>;

export type FinalisationQualiteAutoSaveFormValues = z.infer<
  typeof finalisationQualiteAutoSaveSchema
>;
