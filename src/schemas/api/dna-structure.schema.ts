import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const dnaApiSchema = z.object({
  id: zId(),
  code: z.string(),
});

export const dnaStructureApiSchema = z.object({
  id: zId(),
  description: z.string().nullish(),
  dna: dnaApiSchema,
  startDate: z.string().datetime().nullish(),
  endDate: z.string().datetime().nullish(),
});

export type DnaStructureApiType = z.infer<typeof dnaStructureApiSchema>;
