import { SessionGrant } from "@/types/global";

import { GrantWithPerimetre } from "./user.db.type";

export const getEffectiveGrants = (user: {
  grants: GrantWithPerimetre[];
  emailPattern: { grants: GrantWithPerimetre[] } | null;
}): GrantWithPerimetre[] => [
  ...(user.emailPattern?.grants ?? []),
  ...user.grants,
];

export const toSessionGrant = ({
  role,
  perimetre,
}: GrantWithPerimetre): SessionGrant => {
  const departementNumeros = new Set([
    ...perimetre.regions.flatMap(({ region }) =>
      region.departements.map(({ numero }) => numero)
    ),
    ...perimetre.departements.map(({ departementNumero }) => departementNumero),
  ]);

  return {
    role,
    isNational: perimetre.isNational,
    departementNumeros: [...departementNumeros],
    structureIds: perimetre.structures.map(({ structureId }) => structureId),
    operateurId: perimetre.operateurId,
  };
};
