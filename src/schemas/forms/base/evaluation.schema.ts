import z from "zod";

import { getYearFromDate } from "@/app/utils/date.util";
import {
  optionalFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
} from "@/app/utils/zodCustomFields";
import { EVALUATION_NOTES_START_YEAR } from "@/constants";

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
  uuid: z.string().optional(), // Used to identify the evaluation when it is not saved in the database (and so does not have an id)
});

const getNotes = (data: z.infer<typeof evaluationAutoSaveSchema>) => [
  data.notePersonne,
  data.notePro,
  data.noteStructure,
  data.note,
];

const evaluationSchema = evaluationAutoSaveSchema
  .refine(
    (data) => {
      const year = data.date ? getYearFromDate(data.date) : undefined;
      const requireNotes =
        year !== undefined && year >= EVALUATION_NOTES_START_YEAR;

      if (requireNotes && getNotes(data).some((note) => note == null)) {
        return false;
      }
      return true;
    },
    {
      error: "Les notes doivent être renseignées",
      path: ["notePersonne", "notePro", "noteStructure", "note"],
    }
  )
  .refine((data) => getNotes(data).every((note) => note !== 0), {
    error: "Les notes doivent être supérieures à 0",
    path: ["notePersonne", "notePro", "noteStructure", "note"],
  })
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
      error: "Les fichiers doivent être renseignés",
      path: ["fileUploads"],
    }
  );

const evaluationsSchema = z.object({
  evaluations: z.array(evaluationSchema).optional(),
  noEvaluationStructure: z.boolean().optional(),
});

export const evaluationsAutoSaveSchema = z.object({
  evaluations: z.array(evaluationAutoSaveSchema).optional(),
  noEvaluationStructure: z.boolean().optional(),
});

export const evaluationsSchemaWithConditionalValidation =
  evaluationsSchema.check(
    z.superRefine((data, ctx) => {
      if (data.noEvaluationStructure === true) {
        return;
      }
      if (
        data.evaluations?.length !== 0 &&
        !data.evaluations?.find((evaluation) => evaluation.date)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Au moins une évaluation est obligatoire",
          path: ["evaluations"],
        });
      }
    })
  );

export type EvaluationFormValues = z.infer<typeof evaluationSchema>;
export type EvaluationsFormValues = z.infer<typeof evaluationsSchema>;
export type EvaluationAutoSaveFormValues = z.infer<
  typeof evaluationAutoSaveSchema
>;
