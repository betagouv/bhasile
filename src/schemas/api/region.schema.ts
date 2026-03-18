import { z } from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const regionApiSchema = z.object({
  id: zId(),
  name: z.string(),
  code: z.string().optional(),
});

export type RegionApiType = z.infer<typeof regionApiSchema>;
