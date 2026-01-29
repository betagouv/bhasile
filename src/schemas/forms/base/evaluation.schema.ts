import z from "zod";

import { getYearFromDate } from "@/app/utils/date.util";
import {
  optionalFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
} from "@/app/utils/zodCustomFields";

const fileUploadSchema = z.object({
  key: z.string().optional(),
  id: zId(),
});

const evaluationAutoSaveSchema = z.object({
  id: zId(),
  date: optionalFrenchDateToISO(),
  notePersonne: zSafeDecimalsNullish(),
  notePro: zSafeDecimalsNullish(),
  noteStructure: zSafeDecimalsNullish(),
  note: zSafeDecimalsNullish(),
  fileUploads: z.array(fileUploadSchema.optional()).optional(),
  uuid: z.string().optional(), // Used to identify the evaluation when it is not saved in the database (and so do not have an id)
});

export const evaluationSchema = evaluationAutoSaveSchema
  .refine(
    (data) => {
      const year = data.date ? getYearFromDate(data.date) : undefined;
      const requireNotes = year !== undefined && year >= 2022;

      if (
        requireNotes &&
        (data.notePersonne === undefined ||
          data.notePro === undefined ||
          data.noteStructure === undefined ||
          data.note === undefined)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Les notes doivent être renseignées",
      path: ["notePersonne", "notePro", "noteStructure", "note"],
    }
  )
  .refine(
    (data) => {
      if (data.date && data.fileUploads && data.fileUploads.length !== 0) {
        return (
          data.fileUploads[0]?.key !== undefined &&
          data.fileUploads[0]?.id !== undefined
        );
      }
      return true;
    },
    {
      message: "Les fichiers doivent être renseignés",
      path: ["fileUploads"],
    }
  );

export const evaluationsSchema = z.object({
  evaluations: z.array(evaluationSchema).optional(),
  noEvaluationStructure: z.boolean().optional(),
});

export const evaluationsAutoSaveSchema = z.object({
  evaluations: z.array(evaluationAutoSaveSchema).optional(),
  noEvaluationStructure: z.boolean().optional(),
});

export const evaluationsSchemaWithConditionalValidation =
  evaluationsSchema.superRefine((data, ctx) => {
    if (data.noEvaluationStructure === true) {
      return;
    }
    if (
      data.evaluations?.length !== 0 &&
      !data.evaluations?.find((evaluation) => evaluation.date)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Au moins une évaluation est obligatoire",
        path: ["evaluations"],
      });
    }
  });

export type EvaluationFormValues = z.infer<typeof evaluationSchema>;
export type EvaluationsFormValues = z.infer<typeof evaluationsSchema>;
export type EvaluationAutoSaveFormValues = z.infer<
  typeof evaluationAutoSaveSchema
>;
