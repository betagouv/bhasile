import { z } from "zod";

export const COMMENTAIRE_MAX_LENGTH = 100;

export const anomalieApiUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    isJustified: z.boolean(),
    commentaire: z
      .string()
      .trim()
      .max(COMMENTAIRE_MAX_LENGTH, {
        error: `La justification ne doit pas dépasser ${COMMENTAIRE_MAX_LENGTH} caractères`,
      })
      .nullish(),
  })
  .refine(
    (anomalie) => !anomalie.isJustified || Boolean(anomalie.commentaire),
    {
      error: "Une justification est requise pour ignorer une anomalie",
      path: ["commentaire"],
    }
  );

export type AnomalieApiUpdate = z.infer<typeof anomalieApiUpdateSchema>;
