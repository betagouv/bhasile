import z from "zod";

import { actesAdministratifsCreationExNihiloSchema } from "@/schemas/forms/base/acteAdministratif.schema";

export const creationActesAdministratifsSchema =
  actesAdministratifsCreationExNihiloSchema;

export type CreationActesAdministratifsFormValues = z.infer<
  typeof creationActesAdministratifsSchema
>;
