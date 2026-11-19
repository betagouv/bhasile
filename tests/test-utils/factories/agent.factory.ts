import { AgentRead, PerimeterRead } from "@/types/agent.type";

export const createPerimeterRead = (
  overrides: Partial<PerimeterRead> = {}
): PerimeterRead => ({
  id: 3,
  name: "DDETS Finistère",
  zoneKey: "DEPARTEMENT:29",
  zoneLabel: "Finistère (29)",
  ...overrides,
});

export const createAgentRead = (
  overrides: Partial<AgentRead> = {}
): AgentRead => ({
  id: 12,
  email: "agent@finistere.gouv.fr",
  name: "Jeanne Agent",
  status: "PENDING",
  perimeter: null,
  lastConnection: "2026-11-02T09:00:00.000Z",
  ...overrides,
});
