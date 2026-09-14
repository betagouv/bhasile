import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { config } from "@/proxy";
import {
  noProtectionPage,
  passwordProtectedPages,
  proConnectProtectedPages,
  protectedApiRoutes,
} from "@/proxy/auth-config";
import { getApiRouteProtection } from "@/proxy/auth-util";

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

const unprotectedAuthenticatedPages = ["/deconnexion"];

describe("config du proxy", () => {
  it.each([
    ...proConnectProtectedPages,
    ...passwordProtectedPages,
    noProtectionPage,
  ])("intercepte les requêtes vers %s", (page) => {
    expect(config.matcher).toContain(
      page === "/" || page === noProtectionPage ? page : `${page}/:path*`
    );
  });

  it.each(listAuthenticatedPages())("protège la page %s", (page) => {
    expect([
      ...proConnectProtectedPages,
      ...unprotectedAuthenticatedPages,
    ]).toContain(page);
  });

  it.each(listApiRoutes())(
    "déclare une protection non ambiguë pour %s %s",
    (method, pathname) => {
      const matching = protectedApiRoutes.filter(
        (route) => route.pattern.test(pathname) && method in route.routes
      );

      expect(matching).toHaveLength(1);
      expect(
        getApiRouteProtection(
          new NextRequest(`https://bhasile.fr${pathname}`, { method }),
          pathname
        )
      ).toBe(matching[0]?.routes[method]);
    }
  );
});

function listAuthenticatedPages(
  directory = "src/app/(authenticated)"
): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .flatMap((entry) => {
      const subDirectory = path.join(directory, entry.name);
      if (entry.name.startsWith("(")) {
        return [
          ...(existsSync(path.join(subDirectory, "page.tsx")) ? ["/"] : []),
          ...listAuthenticatedPages(subDirectory),
        ];
      }
      return [`/${entry.name}`];
    });
}

function listApiRoutes(directory = "src/app/api"): [string, string][] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listApiRoutes(entryPath);
    }
    if (entry.name !== "route.ts") {
      return [];
    }
    const pathname = directory
      .replace("src/app", "")
      .replace(/\[\.\.\..+?\]/g, "segment")
      .replace(/\[.+?\]/g, "1");
    const methods = readFileSync(entryPath, "utf8").matchAll(
      /export (?:async )?(?:function|const) (GET|POST|PUT|PATCH|DELETE|HEAD)\b/g
    );
    return [...methods].map((match): [string, string] => [match[1], pathname]);
  });
}
