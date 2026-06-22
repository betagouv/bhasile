import z from "zod";

import {
  blankStringsToUndefined,
  frenchDateToISO,
} from "@/app/utils/zodCustomFields";
import {
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsFermetureSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";

export const fermetureSchema = z
  .object({ effectiveDate: frenchDateToISO() })
  .and(actesAdministratifsFermetureSchema);

export const fermetureDraftSchema = z.preprocess(
  blankStringsToUndefined,
  z
    .object({ effectiveDate: frenchDateToISO().optional() })
    .and(actesAdministratifsAutoSaveSchema)
);

export type FermetureFormValues = z.infer<typeof fermetureSchema>;

export type FermetureDraftFormValues = z.infer<typeof fermetureDraftSchema>;
