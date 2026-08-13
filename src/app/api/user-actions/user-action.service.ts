import { after } from "next/server";
import { getServerSession } from "next-auth";

import {
  UserActionCategory,
  UserActionDescription,
} from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";

import { createUserAction } from "./user-action.repository";
import { getActionFromMethod } from "./user-action.util";

// Les fonctions de ce fichier sont asynchrones mais il faut les appeler sans
// await pour ne pas bloquer l'exécution de la requête principale

export const createStructureEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({ action: getActionFromMethod(method), structureId });
};

export const createCpomEvent = async (method: string, cpomId: number) => {
  await createUserAction({ action: getActionFromMethod(method), cpomId });
};

export const createOperateurEvent = async (
  method: string,
  operateurId: number
) => {
  await createUserAction({ action: getActionFromMethod(method), operateurId });
};

export const createOperateurReadEvent = async (operateurId: number) => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return;
  }

  after(() =>
    createUserAction({
      action: UserActionCategory.READ,
      operateurId,
      userEmail,
    })
  );
};

export const createStatistiquesEvent = async (method: string) => {
  await createUserAction({
    action: getActionFromMethod(method),
    description: UserActionDescription.STATISTIQUES_TABLE,
  });
};

export const createStatistiquesCartographieEvent = async (method: string) => {
  await createUserAction({
    action: getActionFromMethod(method),
    description: UserActionDescription.STATISTIQUES_CARTOGRAPHIE,
  });
};
