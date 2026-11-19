import { z } from "zod";

import { GrantScope } from "@/generated/prisma/enums";

const perimeterNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Le nom du périmètre est requis" });

export const perimeterApiCreateSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal(GrantScope.DEPARTEMENT),
    departementNumero: z
      .string()
      .min(1, { error: "Le département est requis" }),
    name: perimeterNameSchema,
  }),
  z.object({
    scope: z.literal(GrantScope.REGION),
    regionId: z.number().int().positive({ error: "La région est requise" }),
    name: perimeterNameSchema,
  }),
]);

export type PerimeterApiCreate = z.infer<typeof perimeterApiCreateSchema>;
