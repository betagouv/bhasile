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
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
});

export type DnaStructureApiType = z.infer<typeof dnaStructureApiSchema>;
