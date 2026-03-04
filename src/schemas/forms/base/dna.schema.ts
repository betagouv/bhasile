import z from "zod";

import { nullishFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";

const dnaSchema = z.object({
  id: zId(),
  code: z.string(),
  description: z.string().optional(),
});

const dnaStructureSchema = z.object({
  id: zId(),
  dna: dnaSchema,
  structureId: zId(),
  startDate: nullishFrenchDateToISO(),
  endDate: nullishFrenchDateToISO(),
});

export const dnaStructuresSchema = z.object({
  dnaStructures: z.array(dnaStructureSchema),
});

export type DnaStructureFormValues = z.infer<typeof dnaStructureSchema>;
