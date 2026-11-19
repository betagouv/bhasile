import { accessibleBy } from "@casl/prisma";

import type { Prisma } from "@/generated/prisma/client";
import { Visibility } from "@/generated/prisma/enums";
import { SessionPermissions, SessionUser } from "@/types/global";

import { defineAbilityFor, isAgent } from "./rules";
import { canUpdateStructure, type StructureScope } from "./structure.ability";

export const canAccessTarification = (
  user: SessionPermissions,
  structure: StructureScope
): boolean => {
  if (!user.isSuperAdmin && !isMessagerieEnabled()) {
    return false;
  }
  return canUpdateStructure(excludeNationalGrants(user), structure);
};

// null : aucune structure
export const getTarificationStructureWhere = (
  user: SessionPermissions
): Prisma.StructureWhereInput | null => {
  if (!user.isSuperAdmin && !isMessagerieEnabled()) {
    return null;
  }
  const ability = defineAbilityFor(excludeNationalGrants(user));
  return ability.can("update", "Structure")
    ? accessibleBy(ability, "update").Structure
    : null;
};

export const canParticipateInTarification = (user: SessionUser): boolean =>
  !user.isSuperAdmin;

export const canReadConversation = (
  user: SessionUser,
  conversation: {
    visibility: Visibility;
    structureTarification: { structure: StructureScope };
  }
): boolean => {
  if (!isAgent(user) && conversation.visibility === Visibility.AGENTS) {
    return false;
  }
  return canAccessTarification(
    user,
    conversation.structureTarification.structure
  );
};

// Avant la mise en service, seuls les superadmins voient les échanges : variable absente = fermé
const isMessagerieEnabled = (): boolean =>
  process.env.MESSAGERIE_ENABLED === "true";

// Les grants nationaux n'ouvrent pas la tarification, même en édition
const excludeNationalGrants = (
  user: SessionPermissions
): SessionPermissions => ({
  ...user,
  grants: user.grants.filter((grant) => !grant.isNational),
});
