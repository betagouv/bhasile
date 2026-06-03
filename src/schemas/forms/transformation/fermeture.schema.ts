import z from "zod";

import { frenchDateToISO } from "@/app/utils/zodCustomFields";
import { actesAdministratifsFermetureSchema } from "@/schemas/forms/base/acteAdministratif.schema";

export const fermetureSchema = z
  .object({ effectiveDate: frenchDateToISO() })
  .and(actesAdministratifsFermetureSchema);

export type FermetureFormValues = z.infer<typeof fermetureSchema>;
