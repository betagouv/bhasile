import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";

import type { Prisma, Structure } from "@/generated/prisma/client";
import { SessionUser } from "@/types/global";

import { AppAbility, defineAbilityFor, NO_RECORD_WHERE } from "./rules";

export const getReadableStructureWhere = (
  user: SessionUser | undefined
): Prisma.StructureWhereInput => {
  const ability = defineAbilityFor(user);
  return ability.can("read", "Structure")
    ? accessibleBy(ability).Structure
    : NO_RECORD_WHERE;
};

export const getReadableDepartementNumeros = (
  user: SessionUser
): Set<string> | null => {
  if (user.isSuperAdmin || user.grants.some((grant) => grant.isNational)) {
    return null;
  }
  return new Set(user.grants.flatMap((grant) => grant.departementNumeros));
};

export const canAbilityReadStructure = (
  ability: AppAbility,
  structure: StructureScope
) =>
  ability.can(
    "read",
    subject("Structure", {
      id: structure.id,
      departementAdministratif: structure.departementAdministratif,
      operateurId: structure.operateurId,
    } as Structure)
  );

export const canUpdateStructure = (
  user: SessionUser,
  structure?: StructureScope | null
) => canAbilityUpdateStructure(defineAbilityFor(user), structure ?? {});

export const canAbilityUpdateDepartement = (
  ability: AppAbility,
  departementAdministratif?: string | null
) => canAbilityUpdateStructure(ability, { departementAdministratif });

export const canUpdateDepartement = (
  user: SessionUser,
  departementAdministratif?: string | null
) =>
  canAbilityUpdateDepartement(defineAbilityFor(user), departementAdministratif);

const canAbilityUpdateStructure = (
  ability: AppAbility,
  { id, departementAdministratif }: StructureScope
) =>
  ability.can(
    "update",
    subject("Structure", { id, departementAdministratif } as Structure)
  );

type StructureScope = {
  id?: number;
  departementAdministratif?: string | null;
  operateurId?: number | null;
};
