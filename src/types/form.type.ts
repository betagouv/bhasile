import { z } from "zod";

export enum StepStatus {
  NON_COMMENCE = "NON_COMMENCE",
  PRE_REMPLI = "PRE_REMPLI",
  COMMENCE = "COMMENCE",
  A_VERIFIER = "A_VERIFIER",
  FINALISE = "FINALISE",
  VALIDE = "VALIDE",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodSchema = z.ZodType<any, any>;
