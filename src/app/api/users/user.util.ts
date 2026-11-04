import { AccessRole, GrantScope } from "@/generated/prisma/enums";
import { SessionGrant } from "@/types/global";

import { GrantDb, PerimeterDb, UserWithGrants } from "./user.db.type";

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const getAccountStatus = (user: {
  isActivated: boolean;
  deactivatedAt: Date | null;
}): AccountStatus => {
  if (user.isActivated) {
    return "ACTIVATED";
  }
  return user.deactivatedAt ? "DEACTIVATED" : "PENDING";
};

export type AccountStatus = "PENDING" | "ACTIVATED" | "DEACTIVATED";

export const isAgentUser = (
  user: Pick<UserWithGrants, "isSuperAdmin" | "operateurId" | "perimeter">
): boolean =>
  user.isSuperAdmin || (user.perimeter !== null && user.operateurId === null);

export const getAssignedGrants = (
  user: Pick<
    UserWithGrants,
    "isActivated" | "operateurId" | "perimeter" | "grants"
  >
): GrantDb[] => {
  if (!user.isActivated) {
    return [];
  }
  if (user.operateurId !== null) {
    return user.grants;
  }
  return user.perimeter ? getPerimeterGrants(user.perimeter) : [];
};

export const getPerimeterGrants = (perimeter: PerimeterDb): GrantDb[] => [
  {
    role: AccessRole.LECTEUR,
    scope: GrantScope.NATIONAL,
    region: null,
    departement: null,
    structure: null,
  },
  {
    role: AccessRole.ADMIN,
    scope: perimeter.scope,
    region: perimeter.region,
    departement: perimeter.departement,
    structure: null,
  },
];

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
