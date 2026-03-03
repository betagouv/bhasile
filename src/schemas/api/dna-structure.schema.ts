import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const dnaApiSchema = z.object({
  id: zId(),
  code: z.string(),
  description: z.string().optional(),
});

export const dnaStructureApiSchema = z.object({
  id: zId(),
  dna: dnaApiSchema,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type DnaStructureApiType = z.infer<typeof dnaStructureApiSchema>;
