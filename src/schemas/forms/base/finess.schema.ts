import z from "zod";

import { areAllValuesEmpty, areCodesUnique } from "@/app/utils/common.util";
import { zId } from "@/app/utils/zodCustomFields";

const finessSchema = z.object({
  id: zId(),
  code: z.string().min(1, "Le code FINESS est obligatoire"),
});

const structureFinessSchema = z.object({
  id: zId(),
  description: z.string().optional(),
  finess: finessSchema,
});

const uniqueFinessCodesError = {
  message: "Les codes FINESS doivent être uniques",
  path: ["structureFinesses"],
};

const dropBlankFinessRows = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.filter(
    (structureFiness) =>
      !areAllValuesEmpty({
        description: structureFiness?.description,
        code: structureFiness?.finess?.code,
      })
  );
};

export const structureFinessesSchema = z
  .object({
    structureFinesses: z
      .preprocess(dropBlankFinessRows, z.array(structureFinessSchema))
      .optional(),
  })
  .refine(
    (data) =>
      areCodesUnique(
        data.structureFinesses,
        (structureFiness) => structureFiness.finess?.code
      ),
    uniqueFinessCodesError
  );

export const structureFinessesAutoSaveSchema = z
  .object({
    structureFinesses: z
      .array(
        structureFinessSchema
          .extend({ finess: finessSchema.partial() })
          .partial()
      )
      .optional(),
  })
  .refine(
    (data) =>
      areCodesUnique(
        data.structureFinesses,
        (structureFiness) => structureFiness.finess?.code
      ),
    uniqueFinessCodesError
  );

export type StructureFinessFormValues = z.infer<typeof structureFinessSchema>;
