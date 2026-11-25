import { notFound } from "next/navigation";
import { ReactElement } from "react";

import { getAgents } from "@/app/api/agents/agent.service";
import {
  getPerimeters,
  getZoneOptions,
} from "@/app/api/perimeters/perimeter.service";
import { canManageAgents } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";

import { AgentsManager } from "./_components/AgentsManager";

export default async function CockpitAdminAgents(): Promise<ReactElement> {
  if (!canManageAgents(await getSessionUser())) {
    notFound();
  }
  const [agents, perimeters, zones] = await Promise.all([
    getAgents(),
    getPerimeters(),
    getZoneOptions(),
  ]);

  return (
    <AgentsManager agents={agents} perimeters={perimeters} zones={zones} />
  );
}
