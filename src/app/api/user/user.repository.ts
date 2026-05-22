import prisma from "@/lib/prisma";

const UPDATE_INTERVAL_MINUTES = 60;

export const upsertUser = async ({
  name,
  email,
  emailPattern,
}: UpsertUserArgs): Promise<void> => {
  const now = new Date();
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

export const getUserByEmail = async ({ email }: { email?: string | null }) => {
  if (!email) {
    return null;
  }
  return prisma.user.findUnique({
    where: { email },
    include: {
      emailPattern: {
        include: {
          role: {
            include: {
              roleDepartements: {
                include: {
                  departement: true,
                },
              },
            },
          },
        },
      },
      role: {
        include: {
          roleDepartements: {
            include: {
              departement: true,
            },
          },
        },
      },
    },
  });
};

type UpsertUserArgs = {
  name: string;
  email: string;
  emailPattern?: string;
};
