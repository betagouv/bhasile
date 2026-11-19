import { z } from "zod";

const perimeterIdSchema = z
  .number({ error: "Le périmètre est requis" })
  .int()
  .positive({ error: "Le périmètre est requis" });

export const agentApiCreateSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse mail invalide" })),
  perimeterId: perimeterIdSchema,
});

export type AgentApiCreate = z.infer<typeof agentApiCreateSchema>;

export const agentApiUpdateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ACTIVATED"), perimeterId: perimeterIdSchema }),
  z.object({ status: z.literal("DEACTIVATED") }),
]);

export type AgentApiUpdate = z.infer<typeof agentApiUpdateSchema>;
