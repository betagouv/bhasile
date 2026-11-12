import { DomainError } from "@/app/utils/domain-error.util";
import { SessionPermissions } from "@/types/global";

import { defineAbilityFor } from "./rules";

export const canAccessCockpitAdmin = (user?: SessionPermissions): boolean =>
  defineAbilityFor(user).can("manage", "CockpitAdmin");

export const assertCockpitAdminAccess = (user?: SessionPermissions): void => {
  if (!user) {
    throw new DomainError("Non authentifié", 401);
  }
  if (!canAccessCockpitAdmin(user)) {
    throw new DomainError("Droits insuffisants", 403);
  }
};
