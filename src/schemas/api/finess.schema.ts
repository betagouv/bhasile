import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const finessApiSchema = z.object({
  id: zId(),
  code: z.string().min(1),
});

export const structureFinessApiSchema = z.object({
  id: zId(),
  description: z.string().optional(),
  finess: finessApiSchema,
});

export const structureFinessApiPartialSchema = structureFinessApiSchema
  .partial()
  .extend({ finess: finessApiSchema.partial().optional() });

export type FinessApiType = z.infer<typeof finessApiSchema>;
export type StructureFinessApiType = z.infer<typeof structureFinessApiSchema>;
export type StructureFinessApiPartialType = z.infer<
  typeof structureFinessApiPartialSchema
>;
