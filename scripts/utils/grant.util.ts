import { AccessRole, GrantScope } from "@/generated/prisma/client";

export const getAgentBaseGrants = (zone: AgentZone): AgentGrant[] => {
  if (zone.scope === GrantScope.NATIONAL) {
    return [{ role: AccessRole.EDITEUR, scope: GrantScope.NATIONAL }];
  }

  const lecteurNational = {
    role: AccessRole.LECTEUR,
    scope: GrantScope.NATIONAL,
  };
  if (zone.scope === GrantScope.REGION) {
    return [
      lecteurNational,
      {
        role: AccessRole.EDITEUR,
        scope: GrantScope.REGION,
        regionId: zone.regionId,
      },
    ];
  }
  return [
    lecteurNational,
    ...zone.departementNumeros.map((departementNumero) => ({
      role: AccessRole.EDITEUR,
      scope: GrantScope.DEPARTEMENT,
      departementNumero,
    })),
  ];
};

export const isSameGrant = (first: AgentGrant, second: AgentGrant): boolean =>
  first.role === second.role &&
  first.scope === second.scope &&
  first.regionId === second.regionId &&
  first.departementNumero === second.departementNumero;

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
