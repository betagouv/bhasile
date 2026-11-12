import { SessionPermissions } from "@/types/global";

import { defineAbilityFor } from "./rules";

export const canAccessCockpitAdmin = (user?: SessionPermissions): boolean =>
  defineAbilityFor(user).can("read", "CockpitAdmin");
