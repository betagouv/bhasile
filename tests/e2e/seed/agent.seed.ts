import { getNow } from "@/app/utils/now.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";

const E2E_AGENT_DEPARTEMENT = "75";
const E2E_AGENT_EMAIL_PATTERN = "^e2e\\.agent@bhasile\\.local$";

export const seedAgent = async (): Promise<void> => {
  const departement = await prisma.departement.findUnique({
    where: { numero: E2E_AGENT_DEPARTEMENT },
    select: { numero: true },
  });
  if (!departement) {
    throw new Error(
      `Département ${E2E_AGENT_DEPARTEMENT} absent de la base : lancer \`npx prisma db seed\` avant les tests e2e.`
    );
  }

  const emailPattern = await prisma.emailPattern.upsert({
    where: { pattern: E2E_AGENT_EMAIL_PATTERN },
    update: {},
    create: { pattern: E2E_AGENT_EMAIL_PATTERN },
    select: { id: true },
  });

  await prisma.emailPatternGrant.deleteMany({
    where: { emailPatternId: emailPattern.id },
  });
  await prisma.emailPatternGrant.create({
    data: {
      emailPatternId: emailPattern.id,
      role: AccessRole.EDITEUR,
      scope: GrantScope.DEPARTEMENT,
      departementNumero: departement.numero,
    },
  });

  await prisma.user.upsert({
    where: { email: E2E_AGENT_EMAIL },
    update: { emailPatternId: emailPattern.id },
    create: {
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      emailPatternId: emailPattern.id,
      lastConnection: getNow(),
    },
  });
  await prisma.userGrant.deleteMany({
    where: { user: { email: E2E_AGENT_EMAIL } },
  });
};
