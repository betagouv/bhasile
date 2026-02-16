import z from "zod";

import { fileApiSchema } from "./file.schema";

export const evaluationApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  date: z.string().datetime().optional(),
  notePersonne: z.number().nullish(),
  notePro: z.number().nullish(),
  noteStructure: z.number().nullish(),
  note: z.number().nullish(),
  fileUploads: z.array(fileApiSchema).optional(),
});

export type EvaluationApiType = z.infer<typeof evaluationApiSchema>;
