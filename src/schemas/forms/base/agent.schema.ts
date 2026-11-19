import { z } from "zod";

import { agentApiCreateSchema } from "@/schemas/api/agent.schema";

export const agentFormSchema = agentApiCreateSchema;

export type AgentFormValues = z.infer<typeof agentFormSchema>;
