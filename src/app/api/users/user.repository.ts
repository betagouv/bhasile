import { getNow } from "@/app/utils/now.util";
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
  const data = {
    name,
    lastConnection: now,
    emailPattern: {
      connect: {
        pattern: emailPattern,
      },
    },
  };

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { lastConnection: true },
  });

  if (!existing) {
    await prisma.user.create({ data: { email, ...data } });
    return;
  }

  if (existing.lastConnection >= threshold) {
    return;
  }

  await prisma.user.update({ where: { email }, data });
};

export const findUserIdByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email }, select: { id: true } });

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

type UpsertUserArgs = {
  name: string;
  email: string;
  emailPattern?: string;
};
