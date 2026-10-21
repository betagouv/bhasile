import { getNow } from "@/app/utils/now.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";

const E2E_AGENT_DEPARTEMENT = "75";

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

  const user = await prisma.user.upsert({
    where: { email: E2E_AGENT_EMAIL },
    update: {},
    create: {
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      lastConnection: getNow(),
    },
    select: { id: true },
  });

  await prisma.grant.deleteMany({ where: { userId: user.id } });
  await prisma.grant.create({
    data: {
      userId: user.id,
      role: AccessRole.EDITEUR,
      scope: GrantScope.DEPARTEMENT,
      departementNumero: departement.numero,
    },
  });
};
