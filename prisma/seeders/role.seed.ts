import {
  AgentGrant,
  AgentZone,
  getAgentBaseGrants,
} from "scripts/utils/grant.util";

import {
  AccessRole,
  GrantScope,
  PrismaClient,
} from "@/generated/prisma/client";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const ILE_DE_FRANCE = "Île-de-France";

const TEST_EMAIL_PATTERN = `@${TEST_EMAIL_DOMAIN.replaceAll(".", "\\.")}$`;

export const seedRolesAndAgents = async (
  prisma: PrismaClient
): Promise<void> => {
  const region = await prisma.region.findFirstOrThrow({
    where: { name: ILE_DE_FRANCE },
    select: { id: true },
  });

  const agents: AgentSeed[] = [
    {
      name: "Jean Nation",
      email: `national@${TEST_EMAIL_DOMAIN}`,
      perimeterName: "Administration centrale",
      zone: { scope: GrantScope.NATIONAL },
    },
    {
      name: "Jean Idf",
      email: `regional@${TEST_EMAIL_DOMAIN}`,
      perimeterName: "DREETS Île-de-France",
      zone: { scope: GrantScope.REGION, regionId: region.id },
    },
    {
      name: "Jean Paris",
      email: `departemental@${TEST_EMAIL_DOMAIN}`,
      perimeterName: "DDETS Paris",
      zone: { scope: GrantScope.DEPARTEMENT, departementNumeros: ["75"] },
    },
  ];

  const emailPattern = await prisma.emailPattern.create({
    data: { pattern: TEST_EMAIL_PATTERN, isAgent: true },
    select: { id: true },
  });

  for (const agent of agents) {
    const perimeter = await prisma.perimeter.create({
      data: {
        name: agent.perimeterName,
        grants: { createMany: { data: toPerimeterGrants(agent.zone) } },
      },
      select: { id: true },
    });
    await prisma.user.create({
      data: {
        name: agent.name,
        email: agent.email,
        emailPatternId: emailPattern.id,
        perimeterId: perimeter.id,
        isActivated: true,
        lastConnection: new Date(),
        grants: { createMany: { data: getAgentBaseGrants(agent.zone) } },
      },
    });
  }

  console.log(
    `🧑 ${agents.length} agents de test créés : ${agents
      .map((agent) => agent.email)
      .join(", ")}`
  );
};

const toPerimeterGrants = (zone: AgentZone): AgentGrant[] => {
  if (zone.scope === GrantScope.REGION) {
    return [
      { role: AccessRole.ADMIN, scope: zone.scope, regionId: zone.regionId },
    ];
  }
  if (zone.scope === GrantScope.DEPARTEMENT) {
    return zone.departementNumeros.map((departementNumero) => ({
      role: AccessRole.ADMIN,
      scope: zone.scope,
      departementNumero,
    }));
  }
  return [];
};

type AgentSeed = {
  name: string;
  email: string;
  perimeterName: string;
  zone: AgentZone;
};
