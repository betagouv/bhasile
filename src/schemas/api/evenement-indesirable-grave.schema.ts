import { z } from "zod";

export const evenementIndesirableGraveApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  numeroDossier: z.string().optional(),
  evenementDate: z.iso.datetime().optional(),
  declarationDate: z.iso.datetime().optional(),
  type: z.string().optional(),
});

export type EvenementIndesirableGraveApiType = z.infer<
  typeof evenementIndesirableGraveApiSchema
>;
