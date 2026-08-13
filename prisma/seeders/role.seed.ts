import { PrismaClient } from "@/generated/prisma/client";
import { getDepartementNumerosForRegion } from "@/utils/region.util";

// Comptes du fournisseur d'identité de test ProConnect (FIA1)
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const getRegionDepartements = (regionName: string): string[] => {
  const numeros = getDepartementNumerosForRegion(regionName);
  if (numeros.length === 0) {
    throw new Error(`Région ${regionName} absente de DEPARTEMENTS`);
  }
  return numeros;
};

const ANONYMOUS_ROLE_NAME = "ANONYMOUS";

type AgentRoleSeed = {
  roleName: string;
  email: string;
  departementNumeros?: string[];
};

const AGENT_ROLES: AgentRoleSeed[] = [
  {
    roleName: "NATIONAL",
    email: `national@${TEST_EMAIL_DOMAIN}`,
  },
  {
    roleName: "REGION_ILE_DE_FRANCE",
    email: `regional@${TEST_EMAIL_DOMAIN}`,
    departementNumeros: getRegionDepartements("Île-de-France"),
  },
  {
    roleName: "DEPARTEMENT_PARIS",
    email: `departemental@${TEST_EMAIL_DOMAIN}`,
    departementNumeros: ["75"],
  },
];

const toEmailPattern = (email: string): string =>
  `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;

export const seedRolesAndAgents = async (
  prisma: PrismaClient
): Promise<void> => {
  await prisma.role.create({ data: { name: ANONYMOUS_ROLE_NAME } });

  const allDepartements = await prisma.departement.findMany({
    select: { numero: true },
  });

  for (const agentRole of AGENT_ROLES) {
    const departementNumeros =
      agentRole.departementNumeros ??
      allDepartements.map((departement) => departement.numero);

    const role = await prisma.role.create({
      data: {
        name: agentRole.roleName,
        roleDepartements: {
          createMany: {
            data: departementNumeros.map((departementNumero) => ({
              departementNumero,
            })),
          },
        },
      },
      select: { id: true },
    });

    const emailPattern = await prisma.emailPattern.create({
      data: { pattern: toEmailPattern(agentRole.email), roleId: role.id },
      select: { id: true },
    });

    await prisma.user.create({
      data: {
        name: agentRole.roleName,
        email: agentRole.email,
        emailPatternId: emailPattern.id,
        lastConnection: new Date(),
      },
    });
  }

  console.log(
    `🧑 ${AGENT_ROLES.length} agents de test créés : ${AGENT_ROLES.map(
      (agentRole) => agentRole.email
    ).join(", ")}`
  );
};
