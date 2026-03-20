import z from "zod";

import { nullishFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";

const dnaSchema = z.object({
  id: zId(),
  code: z.string().min(1, "Le code DNA est obligatoire"),
  description: z.string().optional(),
});

const dnaStructureSchema = z.object({
  id: zId(),
  dna: dnaSchema,
  structureId: zId(),
  startDate: nullishFrenchDateToISO(),
  endDate: nullishFrenchDateToISO(),
});

export const dnaStructuresSchema = z
  .object({
    dnaStructures: z.array(dnaStructureSchema),
  })
  .refine(
    (data) => {
      if (!data.dnaStructures || data.dnaStructures.length === 0) {
        return false;
      }
      const codes = data.dnaStructures.map((dnaStructure) =>
        dnaStructure.dna?.code?.trim()
      );
      const uniqueCodes = new Set(codes);
      return codes.length === uniqueCodes.size;
    },
    {
      message: "Les codes DNA doivent être uniques",
      path: ["dnaStructures"],
    }
  );

export type DnaStructureFormValues = z.infer<typeof dnaStructureSchema>;
