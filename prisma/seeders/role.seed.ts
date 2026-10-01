import { AgentZone, getAgentBaseGrants } from "scripts/utils/grant.util";

import { GrantScope, PrismaClient } from "@/generated/prisma/client";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const ILE_DE_FRANCE = "Île-de-France";

const toEmailPattern = (email: string): string =>
  `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;

export const seedRolesAndAgents = async (
  prisma: PrismaClient
): Promise<void> => {
  const region = await prisma.region.findFirstOrThrow({
    where: { name: ILE_DE_FRANCE },
    select: { id: true },
  });

  const agents: AgentSeed[] = [
    {
      name: "National",
      email: `national@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.NATIONAL },
    },
    {
      name: ILE_DE_FRANCE,
      email: `regional@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.REGION, regionId: region.id },
    },
    {
      name: "Paris",
      email: `departemental@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.DEPARTEMENT, departementNumeros: ["75"] },
    },
  ];

  for (const agent of agents) {
    const emailPattern = await prisma.emailPattern.create({
      data: {
        pattern: toEmailPattern(agent.email),
        grants: { createMany: { data: getAgentBaseGrants(agent.zone) } },
      },
      select: { id: true },
    });

    await prisma.user.create({
      data: {
        name: agent.name,
        email: agent.email,
        emailPatternId: emailPattern.id,
        lastConnection: new Date(),
      },
    });
  }

  console.log(
    `🧑 ${agents.length} agents de test créés : ${agents
      .map((agent) => agent.email)
      .join(", ")}`
  );
};

type AgentSeed = {
  name: string;
  email: string;
  zone: AgentZone;
};
