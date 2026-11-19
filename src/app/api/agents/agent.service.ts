import { getPerimeterOrThrow } from "@/app/api/perimeters/perimeter.service";
import { createAgentAccessEvent } from "@/app/api/user-actions/user-action.service";
import { getAccountStatus } from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { getNow } from "@/app/utils/now.util";
import { AgentApiCreate, AgentApiUpdate } from "@/schemas/api/agent.schema";
import { AgentRead } from "@/types/agent.type";
import { describeAgentAccess } from "@/utils/agent.util";

import {
  activateAgent,
  createActivatedAgent,
  deactivateAgent,
  findAgentById,
  findAgents,
  findUserIdByEmail,
} from "./agent.repository";

export const getAgents = async (): Promise<AgentRead[]> =>
  (await findAgents()).map((agent) => ({
    id: agent.id,
    email: agent.email,
    name: agent.name,
    status: getAccountStatus(agent),
    perimeter: agent.perimeter,
    lastConnection: agent.lastConnection?.toISOString() ?? null,
  }));

export const addAgent = async (
  { email, perimeterId }: AgentApiCreate,
  method: string
): Promise<void> => {
  if (await findUserIdByEmail(email)) {
    throw new DomainError(
      `Un compte existe déjà pour ${email} : retrouvez-le dans la liste`,
      409
    );
  }
  const perimeter = await getPerimeterOrThrow(perimeterId);
  const { id } = await createActivatedAgent(email, perimeter.id);

  await createAgentAccessEvent(method, {
    targetUserId: String(id),
    from: "Absent de Bhasile",
    to: describeAgentAccess("ACTIVATED", perimeter),
  });
};

export const updateAgentAccess = async (
  id: number,
  input: AgentApiUpdate,
  method: string
): Promise<void> => {
  const agent = await findAgentById(id);
  if (!agent) {
    throw new DomainError("Agent introuvable", 404);
  }
  const from = describeAgentAccess(getAccountStatus(agent), agent.perimeter);

  if (input.status === "ACTIVATED") {
    const perimeter = await getPerimeterOrThrow(input.perimeterId);
    await activateAgent(id, perimeter.id);
    await createAgentAccessEvent(method, {
      targetUserId: String(id),
      from,
      to: describeAgentAccess("ACTIVATED", perimeter),
    });
    return;
  }

  await deactivateAgent(id, getNow());
  await createAgentAccessEvent(method, {
    targetUserId: String(id),
    from,
    to: describeAgentAccess("DEACTIVATED", agent.perimeter),
  });
};
