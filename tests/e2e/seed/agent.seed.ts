import { getNow } from "@/app/utils/now.util";
import { AccessRole } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";

const E2E_AGENT_DEPARTEMENT = "75";
const E2E_AGENT_EMAIL_PATTERN = "^e2e\\.agent@bhasile\\.local$";
const E2E_AGENT_PERIMETRE = "E2E Paris";

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

  const perimetre =
    (await prisma.perimetre.findFirst({
      where: { name: E2E_AGENT_PERIMETRE },
      select: { id: true },
    })) ??
    (await prisma.perimetre.create({
      data: {
        name: E2E_AGENT_PERIMETRE,
        departements: { create: { departementNumero: departement.numero } },
      },
      select: { id: true },
    }));

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
      perimetreId: perimetre.id,
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
