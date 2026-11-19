import { DomainError } from "@/app/utils/domain-error.util";
import { SessionPermissions } from "@/types/global";

import { defineAbilityFor } from "./rules";

export const canAccessCockpitAdmin = (user?: SessionPermissions): boolean =>
  defineAbilityFor(user).can("manage", "CockpitAdmin");

export const canManageAgents = (user?: SessionPermissions): boolean =>
  defineAbilityFor(user).can("manage", "User");

export const assertCockpitAdminAccess = (user?: SessionPermissions): void =>
  assertAllowed(user, canAccessCockpitAdmin);

export const assertAgentsManagementAccess = (user?: SessionPermissions): void =>
  assertAllowed(user, canManageAgents);

const assertAllowed = (
  user: SessionPermissions | undefined,
  isAllowed: (user: SessionPermissions) => boolean
): void => {
  if (!user) {
    throw new DomainError("Non authentifié", 401);
  }
  if (!isAllowed(user)) {
    throw new DomainError("Droits insuffisants", 403);
  }
};
