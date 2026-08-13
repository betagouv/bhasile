import z from "zod";

export const departementApiSchema = z.object({
  numero: z.string(),
  name: z.string().optional(),
  region: z.string().optional(),
  regionId: z.number().optional(),
});
