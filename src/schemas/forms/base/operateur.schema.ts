import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const operateurSchema = z.object({
  id: zId(),
  name: z.string(),
});
