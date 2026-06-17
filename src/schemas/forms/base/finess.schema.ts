import z from "zod";

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

export const structureFinessesSchema = z
  .object({
    structureFinesses: z.array(structureFinessSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.structureFinesses || data.structureFinesses.length === 0) {
        return true;
      }
      const codes = data.structureFinesses.map((structureFiness) =>
        structureFiness.finess?.code?.trim()
      );
      const uniqueCodes = new Set(codes);
      return codes.length === uniqueCodes.size;
    },
    {
      message: "Les codes FINESS doivent être uniques",
      path: ["structureFinesses"],
    }
  );

export const structureFinessesAutoSaveSchema = z.object({
  structureFinesses: z
    .array(
      structureFinessSchema.extend({ finess: finessSchema.partial() }).partial()
    )
    .optional(),
});

export type StructureFinessFormValues = z.infer<typeof structureFinessSchema>;
