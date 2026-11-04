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

  console.log(
    `🧑 ${agents.length} agents de test créés : ${agents
      .map((agent) => agent.email)
      .join(", ")}`
  );
};

type AgentSeed = {
  name: string;
  email: string;
  perimeter: {
    name: string;
    grants: {
      role: AccessRole;
      scope: GrantScope;
      regionId?: number;
      departementNumero?: string;
    }[];
  };
};
