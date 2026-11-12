import { getNow } from "@/app/utils/now.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export const E2E_AGENT_EMAIL = "e2e.agent@bhasile.local";
export const E2E_AGENT_NAME = "E2E Agent";

const E2E_PERIMETER_NAME = "E2E DREETS Île-de-France";
const E2E_REGION_NAME = "Île-de-France";

export const seedAgent = async (): Promise<void> => {
  const region = await prisma.region.findFirst({
    where: { name: E2E_REGION_NAME },
    select: { id: true },
  });
  if (!region) {
    throw new Error(
      `Région ${E2E_REGION_NAME} absente de la base : lancer \`npx prisma db seed\` avant les tests e2e.`
    );
  }

  const grant = {
    role: AccessRole.ADMIN,
    scope: GrantScope.REGION,
    regionId: region.id,
  };
  const perimeter = await prisma.perimeter.upsert({
    where: { name: E2E_PERIMETER_NAME },
    update: { grants: { deleteMany: {}, create: grant } },
    create: { name: E2E_PERIMETER_NAME, grants: { create: grant } },
    select: { id: true },
  });

  await prisma.user.upsert({
    where: { email: E2E_AGENT_EMAIL },
    update: {
      perimeterId: perimeter.id,
      isActivated: true,
      deactivatedAt: null,
    },
    create: {
      email: E2E_AGENT_EMAIL,
      name: E2E_AGENT_NAME,
      perimeterId: perimeter.id,
      isActivated: true,
      lastConnection: getNow(),
    },
  });
};
