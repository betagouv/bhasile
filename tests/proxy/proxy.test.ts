import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { config } from "@/proxy";
import {
  noProtectionPage,
  passwordProtectedPages,
  proConnectProtectedPages,
  protectedApiRoutes,
} from "@/proxy/auth-config";

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
const unprotectedAuthenticatedPages = ["/deconnexion"];

describe("config du proxy", () => {
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

  it("déclare comme protégée chaque page authentifiée", () => {
    const declared = [
      ...proConnectProtectedPages,
      ...unprotectedAuthenticatedPages,
    ];

    expect(
      listAuthenticatedPages().filter((page) => !declared.includes(page))
    ).toEqual([]);
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

function listAuthenticatedPages(
  directory = "src/app/(authenticated)"
): string[] {
  return readdirSync(directory, { withFileTypes: true })
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
}

function listApiRoutes(directory = "src/app/api"): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listApiRoutes(path.join(directory, entry.name))
      : entry.name === "route.ts"
        ? [directory.replace("src/app", "").replace(/\[.+?\]/g, "1")]
        : []
  );
}
