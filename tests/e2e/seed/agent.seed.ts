import { getNow } from "@/app/utils/now.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";

const E2E_AGENT_DEPARTEMENTS = ["75", "92"];

export const seedAgent = async (): Promise<void> => {
  const departements = await prisma.departement.findMany({
    where: { numero: { in: E2E_AGENT_DEPARTEMENTS } },
    select: { numero: true },
  });
  if (departements.length !== E2E_AGENT_DEPARTEMENTS.length) {
    throw new Error(
      `Départements ${E2E_AGENT_DEPARTEMENTS.join(", ")} absents de la base : lancer \`npx prisma db seed\` avant les tests e2e.`
    );
  }

  const user = await prisma.user.upsert({
    where: { email: E2E_AGENT_EMAIL },
    update: { isAgent: true },
    create: {
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      isAgent: true,
      lastConnection: getNow(),
    },
    select: { id: true },
  });

  await prisma.grant.deleteMany({ where: { userId: user.id } });
  await prisma.grant.createMany({
    data: departements.map((departement) => ({
      userId: user.id,
      role: AccessRole.EDITEUR,
      scope: GrantScope.DEPARTEMENT,
      departementNumero: departement.numero,
    })),
  });
};
