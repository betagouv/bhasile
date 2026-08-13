import { getServerSession } from "next-auth";

import {
  UserActionCategory,
  UserActionDescription,
} from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";
import prisma from "@/lib/prisma";

export const createUserAction = async ({
  action,
  structureId,
  cpomId,
  operateurId,
  userEmail,
  description,
}: CreateUserActionArgs): Promise<void> => {
  try {
    const email =
      userEmail ?? (await getServerSession(authOptions))?.user?.email;
    if (!email) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      console.error("Pas d'utilisateur enregistré avec cet email");
      return;
    }

    await prisma.userAction.create({
      data: {
        userId: user.id,
        action,
        structureId,
        cpomId,
        operateurId,
        description,
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
  action: UserActionCategory;
  structureId?: number;
  cpomId?: number;
  operateurId?: number;
  userEmail?: string;
  description?: UserActionDescription;
};
