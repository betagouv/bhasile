import { User } from "next-auth";

import prisma from "../prisma";

export type ProConnectUser = User & {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  poste: string;
};

export const getIsUserAuthorized = async (email: string): Promise<boolean> => {
  const allowedPatterns = await prisma.allowedUser.findMany({
    select: { emailPattern: true },
  });
  return allowedPatterns.some(({ emailPattern }) => {
    const regex = new RegExp(emailPattern, "i");
    return regex.test(email);
  });
};

export const upsertUser = async ({
  prenom,
  nom,
  email,
}: UpsertUserArgs): Promise<void> => {
  await prisma.user.upsert({
    where: { email: email },
    create: {
      prenom: prenom,
      nom: nom,
      email: email,
      lastConnection: new Date(),
    },
    update: {
      lastConnection: new Date(),
    },
  });
};

type UpsertUserArgs = {
  prenom: string;
  nom: string;
  email: string;
};
