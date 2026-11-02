import { OPERATEUR_BASE_PATH } from "@/proxy/auth-config";
import { SessionUser } from "@/types/global";
import { matchesPath } from "@/utils/path.util";

import { isAgent } from "./rules";

export const commonPages = ["/", "/structures", "/statistiques"];

export const agentOnlyPages = ["cpoms", "/ressources"];

export const operateurAllowedPages = [
  "/",
  "/structures",
  OPERATEUR_BASE_PATH,
  "/statistiques",
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

  if (!isUserAgent) {
    const isAllowedForOperateur = operateurAllowedPages.some((base) =>
      matchesPath(pathname, base)
    );

    if (!isAllowedForOperateur) {
      return false;
    }

    if (matchesPath(pathname, OPERATEUR_BASE_PATH)) {
      if (user.operateurId) {
        return pathname === `${OPERATEUR_BASE_PATH}/${user.operateurId}`;
      }
      return false;
    }

    return true;
  }

  if (commonPages.some((base) => matchesPath(pathname, base))) {
    return true;
  }

  return false;
};
