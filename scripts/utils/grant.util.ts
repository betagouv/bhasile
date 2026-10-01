import { AccessRole, GrantScope } from "@/generated/prisma/client";

export const getAgentBaseGrants = (zone: AgentZone): AgentGrant[] => {
  if (zone.scope === GrantScope.NATIONAL) {
    return [{ role: AccessRole.EDITEUR, scope: GrantScope.NATIONAL }];
  }

  const viewerNational = {
    role: AccessRole.VIEWER,
    scope: GrantScope.NATIONAL,
  };
  if (zone.scope === GrantScope.REGION) {
    return [
      viewerNational,
      {
        role: AccessRole.EDITEUR,
        scope: GrantScope.REGION,
        regionId: zone.regionId,
      },
    ];
  }
  return [
    viewerNational,
    ...zone.departementNumeros.map((departementNumero) => ({
      role: AccessRole.EDITEUR,
      scope: GrantScope.DEPARTEMENT,
      departementNumero,
    })),
  ];
};

export const isSameGrant = (
  existing: {
    role: AccessRole;
    scope: GrantScope;
    regionId: number | null;
    departementNumero: string | null;
  },
  grant: AgentGrant
): boolean =>
  existing.role === grant.role &&
  existing.scope === grant.scope &&
  existing.regionId === (grant.regionId ?? null) &&
  existing.departementNumero === (grant.departementNumero ?? null);

export type AgentZone =
  | { scope: typeof GrantScope.NATIONAL }
  | { scope: typeof GrantScope.REGION; regionId: number }
  | { scope: typeof GrantScope.DEPARTEMENT; departementNumeros: string[] };

export type AgentGrant = {
  role: AccessRole;
  scope: GrantScope;
  regionId?: number;
  departementNumero?: string;
};
