import z from "zod";

export const userActionApiSchema = z.object({
  structureId: z.number().optional(),
  details: z.string().optional(),
});

export type UserActionApiType = z.infer<typeof userActionApiSchema>;
