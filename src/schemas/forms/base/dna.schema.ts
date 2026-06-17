import z from "zod";

import { areCodesUnique } from "@/app/utils/string.util";
import { nullishFrenchDateToISO, zId } from "@/app/utils/zodCustomFields";

const dnaSchema = z.object({
  id: zId(),
  code: z.string().min(1, "Le code DNA est obligatoire"),
});

const dnaStructureSchema = z.object({
  id: zId(),
  description: z.string().nullish(),
  dna: dnaSchema,
  structureId: zId(),
  startDate: nullishFrenchDateToISO(),
  endDate: nullishFrenchDateToISO(),
});

const uniqueDnaCodesError = {
  message: "Les codes DNA doivent être uniques",
  path: ["dnaStructures"],
};

export const dnaStructuresSchema = z
  .object({
    dnaStructures: z.array(dnaStructureSchema),
  })
  .refine(
    (data) => {
      return data.dnaStructures && data.dnaStructures.length > 0;
    },
    {
      message: "Au moins un code DNA est requis",
      path: ["dnaStructures"],
    }
  )
  .refine(
    (data) =>
      areCodesUnique(data.dnaStructures, (dnaStructure) => dnaStructure.dna?.code),
    uniqueDnaCodesError
  );

export const dnaStructuresAutoSaveSchema = z
  .object({
    dnaStructures: z
      .array(dnaStructureSchema.extend({ dna: dnaSchema.partial() }).partial())
      .optional(),
  })
  .refine(
    (data) =>
      areCodesUnique(data.dnaStructures, (dnaStructure) => dnaStructure.dna?.code),
    uniqueDnaCodesError
  );

export type DnaStructureFormValues = z.infer<typeof dnaStructureSchema>;
