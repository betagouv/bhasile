import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withAuth } from "next-auth/middleware";

import { canAccessApp } from "./lib/casl";
import { canAccessPage } from "./lib/casl/pages";
import { authOptions } from "./lib/next-auth/auth";
import {
  pendingAccessPage,
  protectedPages,
  publicApiRoutes,
} from "./proxy/auth-config";
import { filtersProxy } from "./proxy/filters";
import { SessionUser } from "./types/global";
import { matchesPath } from "./utils/path.util";

const authenticatedPagesProxy = withAuth(filtersProxy, {
  callbacks: {
    authorized: ({ token }) => {
      return token !== null;
    },
  },
  pages: {
    signIn: "/connexion",
  },
});

const protectPage = async (request: NextRequest): Promise<NextResponse> => {
  const { pathname } = request.nextUrl;
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const user = session.user as SessionUser;

    if (!canAccessApp(user)) {
      return NextResponse.redirect(new URL(pendingAccessPage, request.url));
    }

    if (!canAccessPage(user, pathname)) {
      const target = pathname === "/" ? "/structures" : "/404";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return (authenticatedPagesProxy as (request: NextRequest) => NextResponse)(
    request
  );
};

const protectApi = async (request: NextRequest): Promise<NextResponse> => {
  const isPublic = publicApiRoutes.some((route) =>
    matchesPath(request.nextUrl.pathname, route)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  const session = await getServerSession(authOptions);
  const hasSession =
    !!session?.user && canAccessApp(session.user as SessionUser);

  if (!hasSession) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  return NextResponse.next();
};

export async function proxy(request: NextRequest) {
  const isProtectedPage = protectedPages.some((page) =>
    matchesPath(request.nextUrl.pathname, page)
  );

  return isProtectedPage ? protectPage(request) : protectApi(request);
}

export const config = {
  matcher: [
    // Pages
    "/",
    "/structures/:path*",
    "/operateurs/:path*",
    "/cpoms/:path*",
    "/statistiques/:path*",
    "/ressources/:path*",
    "/parametres/:path*",
    // Routes API
    "/api/:path*",
  ],
};
