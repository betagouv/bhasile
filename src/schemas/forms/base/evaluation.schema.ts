import z from "zod";

import { getYearFromDate } from "@/app/utils/date.util";
import {
  optionalFrenchDateToISO,
  zId,
  zSafeDecimalsNullish,
} from "@/app/utils/zodCustomFields";
import {
  EVALUATION_NOTE_MAX,
  EVALUATION_NOTE_MIN,
  EVALUATION_NOTES_START_YEAR,
} from "@/constants";

const fileUploadSchema = z.object({
  key: z.string().optional(),
  id: zId(),
});

const noteFields = [
  "notePersonne",
  "notePro",
  "noteStructure",
  "note",
] as const;

const evaluationBaseSchema = z.object({
  id: zId(),
  date: optionalFrenchDateToISO(),
  notePersonne: zSafeDecimalsNullish(),
  notePro: zSafeDecimalsNullish(),
  noteStructure: zSafeDecimalsNullish(),
  note: zSafeDecimalsNullish(),
  fileUploads: z.array(fileUploadSchema.optional()).optional(),
  uuid: z.string().optional(), // Used to identify the evaluation when it is not saved in the database (and so does not have an id)
});

type EvaluationBase = z.infer<typeof evaluationBaseSchema>;

// Une note reste sur 1-4 quelle que soit l'année. Seules les évaluations post 2022 DOIVENT en porter.
const requiresNotes = (data: EvaluationBase): boolean => {
  const year = data.date ? getYearFromDate(data.date) : undefined;
  return year !== undefined && year >= EVALUATION_NOTES_START_YEAR;
};

const evaluationAutoSaveSchema = evaluationBaseSchema.check(
  z.superRefine((data, ctx) => {
    for (const field of noteFields) {
      const note = data[field];
      if (
        note !== null &&
        note !== undefined &&
        (note < EVALUATION_NOTE_MIN || note > EVALUATION_NOTE_MAX)
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Les notes doivent être comprises entre ${EVALUATION_NOTE_MIN} et ${EVALUATION_NOTE_MAX}`,
          path: [field],
        });
      }
    }
  })
);

const evaluationSchema = evaluationAutoSaveSchema
  .check(
    z.superRefine((data, ctx) => {
      if (!requiresNotes(data)) {
        return;
      }
      for (const field of noteFields) {
        if (data[field] === null) {
          ctx.addIssue({
            code: "custom",
            message: "Les notes doivent être renseignées",
            path: [field],
          });
        }
      }
    })
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
