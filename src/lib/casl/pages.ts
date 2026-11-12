import { SessionUser } from "@/types/global";
import { matchesPath } from "@/utils/path.util";

import { isAgent } from "./rules";

// TODO : ajouter le tableau de bord, cpoms et statistiques plus tard pour les opérateurs et les retirer de agentOnlyPages
export const commonPages = ["/structures"];

export const agentOnlyPages = [
  "/",
  "/ressources",
  "/cpoms",
  "/statistiques",
  "/structures/transformation",
];

export const canAccessPage = (
  user: SessionUser | undefined,
  pathname: string
): boolean => {
  if (!user) {
    return false;
  }

  const isUserAgent = isAgent(user);

  if (agentOnlyPages.some((base) => matchesPath(pathname, base))) {
    return isUserAgent;
  }

  if (commonPages.some((base) => matchesPath(pathname, base))) {
    return true;
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
