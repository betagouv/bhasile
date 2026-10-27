import { Visibility } from "@/generated/prisma/enums";
import { SessionUser } from "@/types/global";

import { canUpdateStructure } from "./structure.ability";

// Les grants nationaux n'ouvrent pas la tarification, même en édition
export const canAccessTarification = (
  user: SessionUser,
  structure: TarificationStructureScope
): boolean =>
  canUpdateStructure(
    { ...user, grants: user.grants.filter((grant) => !grant.isNational) },
    structure
  );

export const canReadConversation = (
  user: SessionUser,
  conversation: {
    visibility: Visibility;
    structureTarification: { structure: TarificationStructureScope };
  }
): boolean => {
  const isOperateurUser = user.operateurId !== null;
  if (isOperateurUser && conversation.visibility === Visibility.AGENTS) {
    return false;
  }
  return canAccessTarification(
    user,
    conversation.structureTarification.structure
  );
};

type TarificationStructureScope = {
  id: number;
  departementAdministratif: string;
  operateurId: number | null;
};
