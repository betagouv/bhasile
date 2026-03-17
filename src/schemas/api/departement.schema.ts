import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const departementApiSchema = z.object({
  id: zId(),
  numero: z.string(),
  name: z.string().optional(),
  region: z.string().optional(),
  regionId: z.number().optional(),
});
