import { getNow } from "@/app/utils/now.util";
import { GrantScope } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

import { UserWithGrants, userWithGrantsSelect } from "./user.db.type";

const UPDATE_INTERVAL_MINUTES = 60;

export const upsertUser = async ({
  name,
  email,
  emailPattern,
}: UpsertUserArgs): Promise<void> => {
  const now = getNow();
  const threshold = new Date(
    now.getTime() - UPDATE_INTERVAL_MINUTES * 60 * 1000
  );
  const existing = await prisma.user.findFirst({
    where: emailWhere(email),
    orderBy: { id: "asc" },
    select: {
      id: true,
      lastConnection: true,
      emailPattern: { select: { pattern: true } },
    },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        lastConnection: now,
        ...(emailPattern && {
          emailPattern: { connect: { pattern: emailPattern } },
        }),
      },
    });
    return;
  }

  const isRecentConnection =
    existing.lastConnection && existing.lastConnection >= threshold;
  const isSameEmailPattern = existing.emailPattern?.pattern === emailPattern;
  if (isRecentConnection && isSameEmailPattern) {
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      name,
      lastConnection: now,
      emailPattern: emailPattern
        ? { connect: { pattern: emailPattern } }
        : { disconnect: true },
    },
  });
};

export const findUserIdByEmail = (email: string) =>
  prisma.user.findFirst({
    where: emailWhere(email),
    orderBy: { id: "asc" },
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
  return prisma.user.findFirst({
    where: emailWhere(email),
    orderBy: { id: "asc" },
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
      OR: [
        { grants: { some: grantWhere } },
        { emailPattern: { grants: { some: grantWhere } } },
      ],
    },
    select: { ...userWithGrantsSelect, email: true },
  });
};

const emailWhere = (email: string) => ({
  email: { equals: email, mode: "insensitive" as const },
});

type UpsertUserArgs = {
  name: string;
  email: string;
  emailPattern?: string;
};
