import z from "zod";

import { emptyValuesToUndefined } from "@/app/utils/zodCustomFields";
import {
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsFermetureSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";
import { effectiveDateSchema } from "@/schemas/forms/base/effectiveDate.schema";

export const fermetureSchema = z
  .object({ effectiveDate: effectiveDateSchema })
  .and(actesAdministratifsFermetureSchema);

export const fermetureDraftSchema = z.preprocess(
  emptyValuesToUndefined,
  z
    .object({ effectiveDate: effectiveDateSchema.optional() })
    .and(actesAdministratifsAutoSaveSchema)
);

export type FermetureFormValues = z.infer<typeof fermetureSchema>;

export type FermetureDraftFormValues = z.infer<typeof fermetureDraftSchema>;
