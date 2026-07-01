import { z } from "zod";

export enum StepStatus {
  NON_COMMENCE = "NON_COMMENCE",
  COMMENCE = "COMMENCE",
  A_VERIFIER = "A_VERIFIER",
  FINALISE = "FINALISE",
  VALIDE = "VALIDE",
}

/**
 * Contrainte de schéma permissive pour les wrappers de formulaire — l'équivalent
 * zod 4 du `ZodTypeAny` de zod 3 (qui valait `ZodType<any, any>`). Le `any` est
 * volontaire : il garde les valeurs de formulaire typées souplement comme avant
 * et laisse les schémas enveloppés dans `z.preprocess` (entrée `unknown`)
 * satisfaire la borne.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodSchema = z.ZodType<any, any>;
