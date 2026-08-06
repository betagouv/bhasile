import { getNow } from "@/app/utils/now.util";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";
export const E2E_AGENT_ROLE = "DEPARTEMENT_PARIS";

const E2E_AGENT_DEPARTEMENT = "75";
const E2E_AGENT_EMAIL_PATTERN = "^e2e\\.agent@bhasile\\.local$";

export const seedAgent = async (): Promise<void> => {
  await prisma.role.upsert({
    where: { name: "ANONYMOUS" },
    update: {},
    create: { name: "ANONYMOUS" },
  });

  const departement = await prisma.departement.findUnique({
    where: { numero: E2E_AGENT_DEPARTEMENT },
    select: { id: true },
  });
  if (!departement) {
    throw new Error(
      `Département ${E2E_AGENT_DEPARTEMENT} absent de la base : lancer \`npx prisma db seed\` avant les tests e2e.`
    );
  }

  const role = await prisma.role.upsert({
    where: { name: E2E_AGENT_ROLE },
    update: {},
    create: { name: E2E_AGENT_ROLE },
    select: { id: true },
  });

  // Le rôle porte le nom d'un rôle réel : `fill-roles` peut l'avoir créé avec
  // d'autres départements, qu'un simple upsert laisserait en place.
  await prisma.roleDepartement.deleteMany({ where: { roleId: role.id } });
  await prisma.roleDepartement.create({
    data: { departementId: departement.id, roleId: role.id },
  });

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
