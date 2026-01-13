import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withAuth } from "next-auth/middleware";

import { getApiRouteProtection } from "./app/utils/proxy.util";
import { authOptions } from "./lib/next-auth/auth";
import {
  noProtectionPage,
  passwordProtectedPages,
  proConnectProtectedPages,
} from "./proxy-config";

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

const passwordPagesProxy = (request: NextRequest): NextResponse | null => {
  const url = request.nextUrl;

  if (!passwordProtectedPages.some((path) => url.pathname.startsWith(path))) {
    return null;
  }
  const passwordCookie = request.cookies.get("mot-de-passe");
  const passwords = process.env.OPERATEUR_PASSWORDS?.split(",").map(
    (password) => password.trim()
  );
  if (!passwordCookie || !passwords?.includes(passwordCookie?.value)) {
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
  const session = await getServerSession(authOptions);
  const hasProconnectSession = !!session?.user;
  const passwordCookie = request.cookies.get("mot-de-passe");
  const passwords = process.env.OPERATEUR_PASSWORDS?.split(",").map(
    (password) => password.trim()
  );
  const hasPassword =
    passwordCookie && passwords?.includes(passwordCookie?.value);

  if (protection === "none" || request.nextUrl.pathname === noProtectionPage) {
    return NextResponse.next();
  }

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
  if (process.env.DEV_AUTH_BYPASS) {
    return NextResponse.next();
  }

  const isProtected = proConnectProtectedPages.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected) {
    return (proConnectPagesProxy as (request: NextRequest) => NextResponse)(
      request
    );
  }

  const passwordResult = passwordPagesProxy(request);
  if (passwordResult) {
    return passwordResult;
  }

  const apiAuthResult = await protectApiWithAuth(request);
  if (apiAuthResult) {
    return apiAuthResult;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Pages
    "/structures/:path*",
    "/operateurs/:path*",
    "/statistiques/:path*",
    "/ajout-structure/:path*",
    "/ajout-adresses/:path*",
    "/mot-de-passe",
    // Routes API
    "/api/:path*",
  ],
};
