import { getNow } from "@/app/utils/now.util";
import { GrantScope } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

import { UserWithGrants, userWithGrantsSelect } from "./user.db.type";

const UPDATE_INTERVAL_MINUTES = 60;

export const upsertUser = async ({
  name,
  email,
}: UpsertUserArgs): Promise<void> => {
  const now = getNow();
  const threshold = new Date(
    now.getTime() - UPDATE_INTERVAL_MINUTES * 60 * 1000
  );
  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      lastConnection: true,
    },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        lastConnection: now,
      },
    });
    return;
  }

  const isRecentConnection =
    existing.lastConnection && existing.lastConnection >= threshold;
  if (isRecentConnection) {
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name,
      lastConnection: now,
    },
  });
};

export const findUserIdByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

export const getUserWithGrantsByEmail = async ({
  email,
}: {
  email?: string | null;
}): Promise<UserWithGrants | null> => {
  if (!email) {
    return null;
  }
  return prisma.user.findUnique({
    where: { email },
    select: userWithGrantsSelect,
  });
};

export const findUsersWithGrantsOnStructure = ({
  structureId,
  departementNumero,
}: {
  structureId: number;
  departementNumero: string;
}): Promise<(UserWithGrants & { email: string })[]> => {
  const grantWhere = {
    OR: [
      { scope: GrantScope.DEPARTEMENT, departementNumero },
      { scope: GrantScope.STRUCTURE, structureId },
    ],
  };
  return prisma.user.findMany({
    where: {
      isActivated: true,
      OR: [
        { perimeter: { scope: GrantScope.DEPARTEMENT, departementNumero } },
        { grants: { some: grantWhere } },
      ],
    },
    select: { ...userWithGrantsSelect, email: true },
  });
};

type UpsertUserArgs = {
  name: string;
  email: string;
};
