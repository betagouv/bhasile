import { NextRequest } from "next/server";

import { Protection } from "@/types/proxy.type";

import { protectedApiRoutes } from "./auth-config";

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
