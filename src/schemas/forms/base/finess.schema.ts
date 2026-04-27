import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const finessSchema = z.object({
  id: zId(),
  code: z.string().min(1, "Le code FINESS est obligatoire"),
  description: z.string().optional(),
});

export const finessesSchema = z.object({
  finesses: z
    .array(finessSchema.nullish())
    .optional()
    .transform((array) => array?.filter((item) => item !== null) ?? []),
});

export type FinessFormValues = z.infer<typeof finessSchema>;
