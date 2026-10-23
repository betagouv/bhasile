import {
  AccessRole,
  GrantScope,
  PrismaClient,
} from "@/generated/prisma/client";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const ILE_DE_FRANCE = "Île-de-France";

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
            departementNumero: "75",
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
          departementNumero: "75",
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
