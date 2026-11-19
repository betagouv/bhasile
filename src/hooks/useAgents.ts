import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { AgentApiCreate, AgentApiUpdate } from "@/schemas/api/agent.schema";
import { PerimeterApiCreate } from "@/schemas/api/perimeter.schema";

const sendAgentsRequest = async (
  url: string,
  method: "POST" | "PUT",
  data: AgentApiCreate | AgentApiUpdate | PerimeterApiCreate
): Promise<void> => {
  const response = await fetch(url, { method, body: JSON.stringify(data) });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
};

export const useAgents = () => {
  const addPerimeter = (perimeter: PerimeterApiCreate): Promise<void> =>
    sendAgentsRequest("/api/perimeters", "POST", perimeter);

  const addAgent = (agent: AgentApiCreate): Promise<void> =>
    sendAgentsRequest("/api/agents", "POST", agent);

  const updateAgentAccess = (
    id: number,
    access: AgentApiUpdate
  ): Promise<void> => sendAgentsRequest(`/api/agents/${id}`, "PUT", access);

  return { addPerimeter, addAgent, updateAgentAccess };
};
