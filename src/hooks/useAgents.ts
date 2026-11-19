import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { AgentApiCreate, AgentApiUpdate } from "@/schemas/api/agent.schema";
import { PerimeterApiCreate } from "@/schemas/api/perimeter.schema";

const sendAgentsRequest = async (
  url: string,
  method: "POST" | "PUT",
  data: AgentApiCreate | AgentApiUpdate | PerimeterApiCreate
): Promise<Response> => {
  const response = await fetch(url, { method, body: JSON.stringify(data) });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
  return response;
};

export const useAgents = () => {
  const addPerimeter = async (
    perimeter: PerimeterApiCreate
  ): Promise<{ id: number }> =>
    (await sendAgentsRequest("/api/perimeters", "POST", perimeter)).json();

  const addAgent = async (agent: AgentApiCreate): Promise<void> => {
    await sendAgentsRequest("/api/agents", "POST", agent);
  };

  const updateAgentAccess = async (
    id: number,
    access: AgentApiUpdate
  ): Promise<void> => {
    await sendAgentsRequest(`/api/agents/${id}`, "PUT", access);
  };

  return { addPerimeter, addAgent, updateAgentAccess };
};
