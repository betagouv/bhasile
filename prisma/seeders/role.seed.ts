import {
  AgentZone,
  getAgentBaseGrants,
  getOperateurBaseGrants,
} from "scripts/utils/grant.util";

import { GrantScope, PrismaClient } from "@/generated/prisma/client";

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

  const agents: UserSeed[] = [
    {
      name: "Jean Nation",
      email: `national@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.NATIONAL },
    },
    {
      name: "Jean Idf",
      email: `regional@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.REGION, regionId: region.id },
    },
    {
      name: "Jean Paris",
      email: `departemental@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.DEPARTEMENT, departementNumeros: ["75"] },
    },
  ];

  const operateurUsers: UserSeed[] = [
    {
      name: "Jack Opérateur Nation",
      email: `operateur-national@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.NATIONAL },
      operateurId: 1,
    },
    {
      name: "Jack Opérateur Idf",
      email: `operateur-regional@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.REGION, regionId: region.id },
      operateurId: 1,
    },
    {
      name: "Jack Opérateur Paris",
      email: `operateur-departemental@${TEST_EMAIL_DOMAIN}`,
      zone: { scope: GrantScope.DEPARTEMENT, departementNumeros: ["75"] },
      operateurId: 1,
    },
  ];

  const emailPattern = await prisma.emailPattern.create({
    data: { pattern: TEST_EMAIL_PATTERN, isAgent: true },
    select: { id: true },
  });

  for (const agent of agents) {
    await prisma.user.create({
      data: {
        name: agent.name,
        email: agent.email,
        emailPatternId: emailPattern.id,
        lastConnection: new Date(),
        grants: { createMany: { data: getAgentBaseGrants(agent.zone) } },
      },
    });
  }

  for (const operateurUser of operateurUsers) {
    await prisma.user.create({
      data: {
        name: operateurUser.name,
        email: operateurUser.email,
        lastConnection: new Date(),
        grants: {
          createMany: { data: getOperateurBaseGrants(operateurUser.zone) },
        },
        operateurId: operateurUser.operateurId,
        isAgent: false,
      },
    });
  }

  console.log(
    `🧑 ${agents.length} agents de test créés : ${agents
      .map((agent) => agent.email)
      .join(", ")}`
  );

  console.log(
    `🧑 ${operateurUsers.length} utilisateurs opérateurs de test créés : ${operateurUsers
      .map((operateurUser) => operateurUser.email)
      .join(", ")}`
  );
};

type UserSeed = {
  name: string;
  email: string;
  zone: AgentZone;
  operateurId?: number;
};
