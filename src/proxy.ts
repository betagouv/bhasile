import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";

import {
  noProtectionPage,
  passwordProtectedPages,
  publicPages,
} from "./proxy/auth-config";
import { getApiRouteProtection } from "./proxy/auth-util";

const proConnectPagesProxy = withAuth(() => NextResponse.next(), {
  callbacks: {
    authorized: ({ token }) => {
      return token !== null;
    },
  },
  pages: {
    signIn: "/connexion",
  },
});

const getHasPassword = (request: NextRequest): boolean => {
  const passwordCookie = request.cookies.get("mot-de-passe");
  const passwords = process.env.OPERATEUR_PASSWORDS?.split(",").map(
    (password) => password.trim()
  );
  return !!passwordCookie && !!passwords?.includes(passwordCookie.value.trim());
};

const passwordPagesProxy = (request: NextRequest): NextResponse | null => {
  const url = request.nextUrl;

  if (!passwordProtectedPages.some((path) => url.pathname.startsWith(path))) {
    return null;
  }
  if (!getHasPassword(request)) {
    const loginUrl = new URL(noProtectionPage, request.url);
    loginUrl.searchParams.set("from", url.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
};

const protectApiWithAuth = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const protection = getApiRouteProtection(request, request.nextUrl.pathname);

  if (protection === "none") {
    return null;
  }

  const hasProconnectSession = !!(await getToken({ req: request }));
  const hasPassword = getHasPassword(request);

  const isUnauthenticated =
    protection === null ||
    (protection === "proconnect" && !hasProconnectSession) ||
    (protection === "password" && !hasPassword) ||
    (protection === "either" && !hasProconnectSession && !hasPassword);

  if (isUnauthenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  return null;
};

export async function proxy(request: NextRequest) {
  const doBypass =
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_AUTH_BYPASS ||
      request.headers.get("x-dev-auth-bypass") === "1");

  if (doBypass) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return (await protectApiWithAuth(request)) ?? NextResponse.next();
  }

  const isPublicPage = publicPages.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (isPublicPage) {
    return NextResponse.next();
  }

  const passwordResult = passwordPagesProxy(request);
  if (passwordResult) {
    return passwordResult;
  }

  return (proConnectPagesProxy as (request: NextRequest) => NextResponse)(
    request
  );
}

export const config = {
  matcher: ["/((?!_next/|[^/]+\\.[a-z0-9]+$).*)"],
};
