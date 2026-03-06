import { UserRole } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const upsertUser = async ({
  prenom,
  nom,
  email,
  role,
}: UpsertUserArgs): Promise<void> => {
  await prisma.user.upsert({
    where: { email: email },
    create: {
      prenom,
      nom,
      email,
      lastConnection: new Date(),
      role,
    },
    update: {
      role,
      lastConnection: new Date(),
    },
  });
};

type UpsertUserArgs = {
  prenom: string;
  nom: string;
  email: string;
  role: UserRole;
};
