import { NextRequest } from "next/server";

import { Protection } from "@/types/proxy.type";

import {
  agentOnlyPages,
  commonPages,
  OPERATEUR_BASE_PATH,
  operateurPages,
  protectedApiRoutes,
} from "./auth-config";

export const getApiRouteProtection = (
  request: NextRequest,
  pathname: string
): Protection | null => {
  for (const protectedApiRoute of protectedApiRoutes) {
    if (protectedApiRoute.pattern.test(pathname)) {
      const method = Object.keys(protectedApiRoute.routes).find(
        (m) => m === request.method
      );
      if (method) {
        return protectedApiRoute.routes[method!];
      }
    }
  }
  return null;
};

export const matchesPath = (pathname: string, base: string): boolean =>
  base === "/"
    ? pathname === "/"
    : pathname === base || pathname.startsWith(`${base}/`);

export const isPathAllowedForUser = (
  pathname: string,
  operateurId: number,
  isOperateur: boolean
): boolean => {
  if (agentOnlyPages.some((base) => matchesPath(pathname, base))) {
    return !isOperateur;
  }

  if (operateurPages.some((base) => matchesPath(pathname, base))) {
    return !isOperateur || pathname === `${OPERATEUR_BASE_PATH}/${operateurId}`;
  }

  if (commonPages.some((base) => matchesPath(pathname, base))) {
    return true;
  }

  return false;
};
