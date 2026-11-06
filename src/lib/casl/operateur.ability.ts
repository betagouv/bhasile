import { subject } from "@casl/ability";

import type { Operateur } from "@/generated/prisma/client";
import { SessionUser } from "@/types/global";

import { AppAbility, defineAbilityFor } from "./rules";

export const canUpdateOperateur = (
  user: SessionUser,
  operateurId: number
): boolean => canAbilityUpdateOperateur(defineAbilityFor(user), operateurId);

export const canAbilityUpdateOperateur = (
  ability: AppAbility,
  operateurId: number
) =>
  ability.can("update", subject("Operateur", { id: operateurId } as Operateur));
