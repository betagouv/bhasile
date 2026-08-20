import z from "zod";

export const userActionApiSchema = z.object({
  structureId: z.number(),
});
