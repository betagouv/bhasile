import { AccessRole, GrantScope } from "@/generated/prisma/enums";
import { SessionGrant } from "@/types/global";

import { GrantDb } from "./user.db.type";

export const getEffectiveGrants = (user: {
  grants: GrantDb[];
  emailPattern: { grants: GrantDb[] } | null;
}): GrantDb[] =>
  user.grants.length > 0 ? user.grants : (user.emailPattern?.grants ?? []);

export const isAgentUser = (user: {
  isSuperAdmin: boolean;
  isAgent: boolean | null;
  operateurId: number | null;
  emailPattern: { isAgent: boolean } | null;
}): boolean =>
  user.isSuperAdmin ||
  ((user.isAgent ?? user.emailPattern?.isAgent ?? false) &&
    user.operateurId === null);

export const getAssignedGrants = (
  user: Parameters<typeof isAgentUser>[0] &
    Parameters<typeof getEffectiveGrants>[0]
): GrantDb[] =>
  isAgentUser(user) || user.operateurId !== null
    ? getEffectiveGrants(user)
    : [];

export const toContactGrant = (structureId: number): SessionGrant => ({
  role: AccessRole.LECTEUR,
  isNational: false,
  departementNumeros: [],
  regionIds: [],
  structureIds: [structureId],
});

export const toSessionGrant = (grant: GrantDb): SessionGrant => ({
  role: grant.role,
  isNational: grant.scope === GrantScope.NATIONAL,
  departementNumeros: getDepartementNumeros(grant),
  regionIds: getRegionIds(grant),
  structureIds:
    grant.scope === GrantScope.STRUCTURE && grant.structure
      ? [grant.structure.id]
      : [],
});

const getDepartementNumeros = (grant: GrantDb): string[] => {
  if (grant.scope === GrantScope.REGION) {
    return grant.region?.departements.map(({ numero }) => numero) ?? [];
  }
  if (grant.scope === GrantScope.DEPARTEMENT && grant.departement) {
    return [grant.departement.numero];
  }
  return [];
};

const getRegionIds = (grant: GrantDb): number[] => {
  if (grant.scope === GrantScope.REGION && grant.region) {
    return [grant.region.id];
  }
  if (grant.scope === GrantScope.DEPARTEMENT && grant.departement?.regionId) {
    return [grant.departement.regionId];
  }
  return [];
};
