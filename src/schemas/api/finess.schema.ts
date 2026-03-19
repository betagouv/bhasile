import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const finessApiSchema = z.object({
  id: zId(),
  code: z.string().min(1),
  description: z.string().optional(),
});

export type FinessApiType = z.infer<typeof finessApiSchema>;
