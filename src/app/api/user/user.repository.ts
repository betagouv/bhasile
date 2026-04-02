import prisma from "@/lib/prisma";

export const upsertUser = async ({
  name,
  email,
  emailPattern,
}: UpsertUserArgs): Promise<void> => {
  await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      lastConnection: new Date(),
      emailPattern: {
        connect: {
          pattern: emailPattern,
        },
      },
    },
    update: {
      name,
      lastConnection: new Date(),
      emailPattern: {
        connect: {
          pattern: emailPattern,
        },
      },
    },
  });
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
