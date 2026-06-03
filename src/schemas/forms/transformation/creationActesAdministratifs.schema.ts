import z from "zod";

import {
  actesAdministratifsAutoSaveSchema,
  actesAdministratifsCreationExNihiloSchema,
} from "@/schemas/forms/base/acteAdministratif.schema";

export const creationActesAdministratifsSchema =
  actesAdministratifsCreationExNihiloSchema;

export const creationActesAdministratifsDraftSchema =
  actesAdministratifsAutoSaveSchema;

export type CreationActesAdministratifsFormValues = z.infer<
  typeof creationActesAdministratifsSchema
>;

export type CreationActesAdministratifsDraftFormValues = z.infer<
  typeof creationActesAdministratifsDraftSchema
>;
