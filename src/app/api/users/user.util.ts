import { GrantScope } from "@/generated/prisma/enums";
import { SessionGrant } from "@/types/global";

import { GrantDb } from "./user.db.type";

export const getEffectiveGrants = (user: {
  grants: GrantDb[];
  emailPattern: { grants: GrantDb[] } | null;
}): GrantDb[] =>
  user.grants.length > 0 ? user.grants : (user.emailPattern?.grants ?? []);

export const toSessionGrant = (grant: GrantDb): SessionGrant => ({
  role: grant.role,
  isNational: grant.scope === GrantScope.NATIONAL,
  departementNumeros: getDepartementNumeros(grant),
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
