import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const dnaSchema = z.object({
  id: zId(),
  code: z.string(),
  description: z.string().optional(),
});

const dnaStructureSchema = z.object({
  id: zId(),
  dna: dnaSchema,
  structureId: zId(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const dnaStructuresSchema = z.object({
  dnaStructures: z.array(dnaStructureSchema),
});
