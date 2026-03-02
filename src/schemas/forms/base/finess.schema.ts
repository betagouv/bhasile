import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const finessSchema = z.object({
  id: zId(),
  code: z.string(),
  description: z.string().optional(),
});

export const finessesSchema = z.object({
  finesses: z.array(finessSchema),
});
