import { AccessRole, PrismaClient } from "@/generated/prisma/client";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

type AgentSeed = {
  email: string;
  perimetreName: string;
  regionName?: string;
  departementNumero?: string;
};

const AGENTS: AgentSeed[] = [
  {
    email: `national@${TEST_EMAIL_DOMAIN}`,
    perimetreName: "National",
  },
  {
    email: `regional@${TEST_EMAIL_DOMAIN}`,
    perimetreName: "Île-de-France",
    regionName: "Île-de-France",
  },
  {
    email: `departemental@${TEST_EMAIL_DOMAIN}`,
    perimetreName: "Paris",
    departementNumero: "75",
  },
];

const toEmailPattern = (email: string): string =>
  `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;

export const seedRolesAndAgents = async (
  prisma: PrismaClient
): Promise<void> => {
  const national = await prisma.perimetre.create({
    data: { name: "National", isNational: true },
    select: { id: true },
  });

  for (const agent of AGENTS) {
    const grants =
      agent.regionName || agent.departementNumero
        ? [
            { role: AccessRole.VIEWER, perimetreId: national.id },
            {
              role: AccessRole.EDITEUR,
              perimetreId: await createZonePerimetre(prisma, agent),
            },
          ]
        : [{ role: AccessRole.EDITEUR, perimetreId: national.id }];

    const emailPattern = await prisma.emailPattern.create({
      data: {
        pattern: toEmailPattern(agent.email),
        grants: { createMany: { data: grants } },
      },
      select: { id: true },
    });

    await prisma.user.create({
      data: {
        name: agent.perimetreName,
        email: agent.email,
        emailPatternId: emailPattern.id,
        lastConnection: new Date(),
      },
    });
  }

  console.log(
    `🧑 ${AGENTS.length} agents de test créés : ${AGENTS.map(
      (agent) => agent.email
    ).join(", ")}`
  );
};

const createZonePerimetre = async (
  prisma: PrismaClient,
  { perimetreName, regionName, departementNumero }: AgentSeed
): Promise<number> => {
  const region = regionName
    ? await prisma.region.findFirstOrThrow({
        where: { name: regionName },
        select: { id: true },
      })
    : null;

  const perimetre = await prisma.perimetre.create({
    data: {
      name: perimetreName,
      regions: region ? { create: { regionId: region.id } } : undefined,
      departements: departementNumero
        ? { create: { departementNumero } }
        : undefined,
    },
    select: { id: true },
  });
  return perimetre.id;
};
