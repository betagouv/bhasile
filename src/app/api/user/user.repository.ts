import { Role } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const upsertUser = async ({
  prenom,
  nom,
  email,
  role,
  emailPattern,
}: UpsertUserArgs): Promise<void> => {
  await prisma.user.upsert({
    where: { email },
    create: {
      prenom,
      nom,
      email,
      lastConnection: new Date(),
      emailPattern: {
        connect: {
          pattern: emailPattern,
        },
      },
    },
    update: {
      role: { connect: { id: role.id } },
      lastConnection: new Date(),
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
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  emailPattern?: string;
};
