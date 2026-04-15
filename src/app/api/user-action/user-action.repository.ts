import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";

import { getActionFromMethod } from "./user-action.util";

export const createUserAction = async ({
  method,
  structureId,
  cpomId,
  operateurId,
}: CreateUserActionArgs): Promise<void> => {
  try {
    const session = await getServerSession(authOptions);

    const userEmail = session?.user?.email;
    if (!userEmail) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (!user) {
      console.error("Pas d'utilisateur enregistré avec cet email");
      return;
    }

    await prisma.userAction.create({
      data: {
        userId: user!.id,
        action: getActionFromMethod(method),
        structureId,
        cpomId,
        operateurId,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création d'un événement utilisateur",
      error
    );
  }
};

type CreateUserActionArgs = {
  method: string;
  structureId?: number;
  cpomId?: number;
  operateurId?: number;
};
