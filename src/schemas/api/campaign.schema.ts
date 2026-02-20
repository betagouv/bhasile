import z from "zod";

export const campaignApiSchema = z.object({
  id: z.number().optional(),
  structureCodeDna: z.string().optional(),
  name: z.string().optional(),
  launched: z.boolean().optional(),
});

export type CampaignApiType = z.infer<typeof campaignApiSchema>;
