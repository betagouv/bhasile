import { z } from "zod";

import { GrantScope } from "@/generated/prisma/enums";
import { PerimeterApiCreate } from "@/schemas/api/perimeter.schema";

export const perimeterFormSchema = z.object({
  scope: z.enum([GrantScope.DEPARTEMENT, GrantScope.REGION]),
  zoneId: z.string().min(1, { error: "La zone est requise" }),
  name: z.string().trim().min(1, { error: "Le nom du périmètre est requis" }),
});

export type PerimeterFormValues = z.infer<typeof perimeterFormSchema>;

export const toPerimeterApiCreate = ({
  scope,
  zoneId,
  name,
}: PerimeterFormValues): PerimeterApiCreate =>
  scope === GrantScope.DEPARTEMENT
    ? { scope, departementNumero: zoneId, name }
    : { scope, regionId: Number(zoneId), name };
