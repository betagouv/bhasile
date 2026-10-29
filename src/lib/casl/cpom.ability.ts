import { subject } from "@casl/ability";
import { accessibleBy } from "@casl/prisma";

import type { CpomGranularity, Prisma } from "@/generated/prisma/client";
import { SessionUser } from "@/types/global";

import { AppAbility, defineAbilityFor, NO_RECORD_WHERE } from "./rules";

export const getReadableCpomWhere = (
  user: SessionUser | undefined
): Prisma.CpomWhereInput => getCpomWhere(user, "read");

export const getUpdatableCpomWhere = (
  user: SessionUser | undefined
): Prisma.CpomWhereInput => getCpomWhere(user, "update");

const getCpomWhere = (
  user: SessionUser | undefined,
  action: "read" | "update"
): Prisma.CpomWhereInput => {
  const ability = defineAbilityFor(user);
  return ability.can(action, "Cpom")
    ? accessibleBy(ability, action).Cpom
    : NO_RECORD_WHERE;
};

export const canAbilityReadCpom = (ability: AppAbility, cpom: CpomScope) =>
  ability.can("read", subject("Cpom", { ...cpom } as never));

export const canSaveCpom = (
  user: SessionUser,
  cpom: Partial<CpomScope>,
  existingCpom: CpomScope | null
): boolean => {
  const ability = defineAbilityFor(user);
  if (existingCpom && !canAbilityUpdateCpom(ability, existingCpom)) {
    return false;
  }
  return canAbilityUpdateCpom(ability, {
    granularity: cpom.granularity,
    regionId: cpom.regionId ?? null,
    departements: cpom.departements ?? existingCpom?.departements ?? [],
    structures: cpom.structures ?? existingCpom?.structures ?? [],
  });
};

export const canAbilityUpdateCpom = (ability: AppAbility, cpom: CpomScope) =>
  ability.can("update", subject("Cpom", { ...cpom } as never));

type CpomScope = {
  granularity?: CpomGranularity;
  regionId?: number | null;
  departements: { departement?: { numero: string } | null }[];
  structures: { structureId: number }[];
};
