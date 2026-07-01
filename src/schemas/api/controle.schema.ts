import { z } from "zod";

import { ControleType } from "@/types/controle.type";

export const controleApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  date: z.iso.datetime().optional(),
  type: z.enum(ControleType).optional(),
  fileUploads: z
    .array(z.object({ key: z.string(), id: z.number() }))
    .optional(),
});

export type ControleApiType = z.infer<typeof controleApiSchema>;
