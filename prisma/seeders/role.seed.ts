import { PrismaClient } from "@/generated/prisma/client";

// Comptes du fournisseur d'identité de test ProConnect (FIA1) : il accepte
// n'importe quelle adresse du domaine, donc aucune donnée d'agent réel n'est
// nécessaire pour se connecter en local ou sur une review app.
const TEST_EMAIL_DOMAIN = "test.proconnect.gouv.fr";

const ILE_DE_FRANCE_DEPARTEMENTS = [
  "75",
  "77",
  "78",
  "91",
  "92",
  "93",
  "94",
  "95",
];

export const ANONYMOUS_ROLE_NAME = "ANONYMOUS";

// Le nom du rôle est significatif : CASL n'ouvre les droits agent qu'aux rôles
// NATIONAL, REGION* et DEPARTEMENT* (voir src/lib/casl/abilities.ts).
export type AgentRoleSeed = {
  roleName: string;
  email: string;
  // undefined = tous les départements, comme le fait fill-roles pour NATIONAL.
  departementNumeros?: string[];
};

export const AGENT_ROLES: AgentRoleSeed[] = [
  {
    roleName: "NATIONAL",
    email: `national@${TEST_EMAIL_DOMAIN}`,
  },
  {
    roleName: "REGION_ILE_DE_FRANCE",
    email: `regional@${TEST_EMAIL_DOMAIN}`,
    departementNumeros: ILE_DE_FRANCE_DEPARTEMENTS,
  },
  {
    roleName: "DEPARTEMENT_PARIS",
    email: `departemental@${TEST_EMAIL_DOMAIN}`,
    departementNumeros: ["75"],
  },
];

// getIsUserAuthorized fait `new RegExp(pattern, "i")` : sans ancrage le motif
// matcherait en sous-chaîne, et deux motifs qui se recouvrent donneraient un
// rôle non déterministe.
export const toEmailPattern = (email: string): string =>
  `^${email.replace(/\./g, "\\.")}$`;

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
