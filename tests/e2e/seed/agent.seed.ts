import { AGENT_ROLES } from "prisma/seeders/role.seed";

import { getNow } from "@/app/utils/now.util";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";
export const E2E_AGENT_ROLE = "DEPARTEMENT_PARIS";
export const E2E_AGENT_DEPARTEMENT = "75";

const E2E_AGENT_EMAIL_PATTERN = "^e2e\\.agent@bhasile\\.local$";

export const seedAgent = async (): Promise<void> => {
  // Toutes les données e2e vivent dans le département 75 : si le seed principal
  // change ce rôle, mieux vaut échouer ici qu'en 403 au milieu d'un scénario.
  const departementalRole = AGENT_ROLES.find(
    (agentRole) => agentRole.roleName === E2E_AGENT_ROLE
  );
  if (
    !departementalRole?.departementNumeros?.includes(E2E_AGENT_DEPARTEMENT)
  ) {
    throw new Error(
      `Le seed principal ne définit plus ${E2E_AGENT_ROLE} sur le département ${E2E_AGENT_DEPARTEMENT} : mettre à jour tests/e2e.`
    );
  }

  // Le rôle et ses départements viennent du seed principal : l'agent e2e s'y
  // rattache au lieu d'en maintenir une seconde définition.
  const role = await prisma.role.findUnique({
    where: { name: E2E_AGENT_ROLE },
    select: { id: true },
  });
  if (!role) {
    throw new Error(
      `Rôle ${E2E_AGENT_ROLE} absent de la base : lancer \`npx prisma db seed\` avant les tests e2e.`
    );
  }

  // L'agent e2e garde son propre email : le cookie est forgé, il ne passe pas
  // par ProConnect et n'utilise donc aucun des comptes de test FIA1.
  const emailPattern = await prisma.emailPattern.upsert({
    where: { pattern: E2E_AGENT_EMAIL_PATTERN },
    update: { roleId: role.id },
    create: { pattern: E2E_AGENT_EMAIL_PATTERN, roleId: role.id },
    select: { id: true },
  });

  await prisma.user.upsert({
    where: { email: E2E_AGENT_EMAIL },
    update: { emailPatternId: emailPattern.id, roleId: null },
    create: {
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      emailPatternId: emailPattern.id,
      lastConnection: getNow(),
    },
  });
};
