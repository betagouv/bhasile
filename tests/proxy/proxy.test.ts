import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";
import {
  noProtectionPage,
  passwordProtectedPages,
  proConnectProtectedPages,
  protectedApiRoutes,
} from "@/proxy/auth-config";

vi.stubEnv("NEXTAUTH_SECRET", "secret-de-test");

vi.mock("next-auth", () => ({ getServerSession: () => null }));
vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
const unprotectedAuthenticatedPages = ["/deconnexion"];

describe("proxy", () => {
  it("redirige vers la connexion chaque page authentifiée", async () => {
    const pages = listAuthenticatedPages().filter(
      (page) => !unprotectedAuthenticatedPages.includes(page)
    );

    const redirections = await Promise.all(
      pages.map(async (page) => {
        const response = await proxy(
          new NextRequest(`http://localhost${page}`)
        );
        return `${page} → ${response.headers.get("location")?.replace("http://localhost", "")}`;
      })
    );

    expect(redirections).toEqual(
      pages.map(
        (page) => `${page} → /connexion?callbackUrl=${encodeURIComponent(page)}`
      )
    );
  });

  it("intercepte chaque page déclarée comme protégée", () => {
    const pages = [
      ...proConnectProtectedPages,
      ...passwordProtectedPages,
      noProtectionPage,
    ];

    const ignored = pages.filter(
      (page) =>
        !config.matcher.some(
          (entry) => entry === page || entry === `${page}/:path*`
        )
    );

    expect(ignored).toEqual([]);
  });

  it("couvre chaque route d'API", () => {
    const uncovered = listApiRoutes().filter(
      (pathname) =>
        !protectedApiRoutes.some((route) => route.pattern.test(pathname))
    );

    expect(uncovered).toEqual([]);
  });

  it("associe une seule protection à chaque route d'API", () => {
    const ambiguous = listApiRoutes().flatMap((pathname) =>
      httpMethods
        .filter(
          (method) =>
            protectedApiRoutes.filter(
              (route) => route.pattern.test(pathname) && method in route.routes
            ).length > 1
        )
        .map((method) => `${method} ${pathname}`)
    );

    expect(ambiguous).toEqual([]);
  });
});

const listAuthenticatedPages = (
  directory = "src/app/(authenticated)"
): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .flatMap((entry) => {
      const subDirectory = path.join(directory, entry.name);
      if (!entry.name.startsWith("(")) {
        return [`/${entry.name}`];
      }
      return [
        ...(existsSync(path.join(subDirectory, "page.tsx")) ? ["/"] : []),
        ...listAuthenticatedPages(subDirectory),
      ];
    });

const listApiRoutes = (directory = "src/app/api"): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listApiRoutes(path.join(directory, entry.name))
      : entry.name === "route.ts"
        ? [directory.replace("src/app", "").replace(/\[.+?\]/g, "1")]
        : []
  );
