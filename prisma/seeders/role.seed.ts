import {
  AccessRole,
  GrantScope,
  PrismaClient,
} from "@/generated/prisma/client";

import { createFakeContact } from "./contact.seed";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const ILE_DE_FRANCE = "Île-de-France";

export const TEST_USER_DEPARTEMENT = "75";

export const TEST_USER_STRUCTURES_COUNT = 3;

export const seedRolesAndAgents = async (
  prisma: PrismaClient
): Promise<void> => {
  const region = await prisma.region.findFirstOrThrow({
    where: { name: ILE_DE_FRANCE },
    select: { id: true },
  });
  const operateur = await prisma.operateur.findFirstOrThrow({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  const agents: AgentSeed[] = [
    {
      name: "Jean Nation",
      email: `national@${TEST_EMAIL_DOMAIN}`,
      perimeter: { name: "Administration centrale", grants: [] },
    },
    {
      name: "Jean Idf",
      email: `regional@${TEST_EMAIL_DOMAIN}`,
      perimeter: {
        name: "DREETS Île-de-France",
        grants: [
          {
            role: AccessRole.ADMIN,
            scope: GrantScope.REGION,
            regionId: region.id,
          },
        ],
      },
    },
    {
      name: "Jean Paris",
      email: `departemental@${TEST_EMAIL_DOMAIN}`,
      perimeter: {
        name: "DDETS Paris",
        grants: [
          {
            role: AccessRole.ADMIN,
            scope: GrantScope.DEPARTEMENT,
            departementNumero: TEST_USER_DEPARTEMENT,
          },
        ],
      },
    },
  ];

  const operateurUsers: OperateurUserSeed[] = [
    {
      name: "Jack Opérateur Nation",
      email: `operateur-national@${TEST_EMAIL_DOMAIN}`,
      grants: [{ role: AccessRole.LECTEUR, scope: GrantScope.NATIONAL }],
    },
    {
      name: "Jack Opérateur Idf",
      email: `operateur-regional@${TEST_EMAIL_DOMAIN}`,
      grants: [
        {
          role: AccessRole.LECTEUR,
          scope: GrantScope.REGION,
          regionId: region.id,
        },
      ],
    },
    {
      name: "Jack Opérateur Paris",
      email: `operateur-departemental@${TEST_EMAIL_DOMAIN}`,
      grants: [
        {
          role: AccessRole.LECTEUR,
          scope: GrantScope.DEPARTEMENT,
          departementNumero: TEST_USER_DEPARTEMENT,
        },
      ],
    },
  ];

  for (const agent of agents) {
    await prisma.user.create({
      data: {
        name: agent.name,
        email: agent.email,
        isActivated: true,
        lastConnection: new Date(),
        perimeter: {
          create: {
            name: agent.perimeter.name,
            grants: { createMany: { data: agent.perimeter.grants } },
          },
        },
      },
    });
  }

  for (const operateurUser of operateurUsers) {
    await prisma.user.create({
      data: {
        name: operateurUser.name,
        email: operateurUser.email,
        isActivated: true,
        lastConnection: new Date(),
        operateurId: operateur.id,
        grants: { createMany: { data: operateurUser.grants } },
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

export const seedContactUsers = async (
  prisma: PrismaClient,
  structureIds: number[]
): Promise<void> => {
  const contactUsers: ContactUserSeed[] = [
    {
      prenom: "Jules",
      nom: "Contact Un",
      email: `contact-operateur-1@${TEST_EMAIL_DOMAIN}`,
      structureIds: structureIds.slice(0, 1),
    },
    {
      prenom: "Jules",
      nom: "Contact Deux",
      email: `contact-operateur-2@${TEST_EMAIL_DOMAIN}`,
      structureIds: structureIds.slice(1, 3),
    },
  ];

  for (const contactUser of contactUsers) {
    await prisma.user.create({
      data: {
        name: `${contactUser.prenom} ${contactUser.nom}`,
        email: contactUser.email,
      },
    });
    const versions = await prisma.structureVersion.findMany({
      where: { structureId: { in: contactUser.structureIds } },
      select: { id: true },
    });
    await prisma.contact.createMany({
      data: versions.map((version) => ({
        ...createFakeContact(),
        prenom: contactUser.prenom,
        nom: contactUser.nom,
        email: contactUser.email,
        structureVersionId: version.id,
      })),
    });
  }

  console.log(`🧑 ${contactUsers.length} contacts de test créés`);
};

type GrantSeed = {
  role: AccessRole;
  scope: GrantScope;
  regionId?: number;
  departementNumero?: string;
};

type AgentSeed = {
  name: string;
  email: string;
  perimeter: {
    name: string;
    grants: GrantSeed[];
  };
};

type OperateurUserSeed = {
  name: string;
  email: string;
  grants: GrantSeed[];
};

type ContactUserSeed = {
  prenom: string;
  nom: string;
  email: string;
  structureIds: number[];
};
