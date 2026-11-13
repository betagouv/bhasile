import { SessionUser } from "@/types/global";
import { matchesPath } from "@/utils/path.util";

import { canAccessCockpitAdmin } from "./admin.ability";
import { defineAbilityFor, isAgent } from "./rules";
import { canAbilityUpdateSomeStructure } from "./structure.ability";

export const commonPages = ["/structures", "/cpoms", "/statistiques"];

export const agentOnlyPages = ["/", "/ressources"];

export const COCKPIT_ADMIN_PAGE = "/parametres/cockpit-admin";

export const canAccessPage = (
  user: SessionUser | undefined,
  pathname: string
): boolean => {
  if (!user) {
    return false;
  }

  if (matchesPath(pathname, COCKPIT_ADMIN_PAGE)) {
    return canAccessCockpitAdmin(user);
  }

  if (matchesPath(pathname, "/structures/transformation")) {
    return canAbilityUpdateSomeStructure(defineAbilityFor(user));
  }

  const isUserAgent = isAgent(user);

  if (!isUserAgent && user.operateurId === null) {
    return matchesPath(pathname, "/structures");
  }

  if (commonPages.some((base) => matchesPath(pathname, base))) {
    return true;
  }

  if (agentOnlyPages.some((base) => matchesPath(pathname, base))) {
    return isUserAgent;
  }

  if (matchesPath(pathname, "/operateurs")) {
    if (!isUserAgent) {
      return (
        user.operateurId !== null &&
        pathname === `/operateurs/${user.operateurId}`
      );
    }
    return true;
  }

  return false;
};
