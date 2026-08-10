import { z } from "zod";

export const anomalieApiUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    isJustified: z.boolean(),
    commentaire: z.string().trim().nullish(),
  })
  .refine(
    (anomalie) => !anomalie.isJustified || Boolean(anomalie.commentaire),
    {
      error: "Une justification est requise pour ignorer une anomalie",
      path: ["commentaire"],
    }
  );

export type AnomalieApiUpdate = z.infer<typeof anomalieApiUpdateSchema>;
