import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { NextRequest } from "next/server";
import {
  createDepartementalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";
import {
  pendingAccessPage,
  protectedPages,
  publicApiRoutes,
} from "@/proxy/auth-config";
import { matchesPath } from "@/utils/path.util";

vi.stubEnv("NEXTAUTH_SECRET", "secret-de-test");

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));
vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

describe("proxy", () => {
  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(null);
  });

  it("redirige vers la connexion chaque page authentifiée", async () => {
    const pages = listAuthenticatedPages();

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

  it("redirige un utilisateur connecté sans aucun droit vers la page d'attente", async () => {
    mockGetServerSession.mockResolvedValue({ user: createSessionUser() });

    const response = await proxy(
      new NextRequest("http://localhost/structures")
    );

    expect(response.headers.get("location")).toBe(
      `http://localhost${pendingAccessPage}`
    );
  });

  it("refuse les routes d'API à un utilisateur connecté sans aucun droit", async () => {
    mockGetServerSession.mockResolvedValue({ user: createSessionUser() });

    const response = await proxy(
      new NextRequest("http://localhost/api/statistiques")
    );

    expect(response.status).toBe(401);
  });

  it("laisse passer un utilisateur qui a au moins un binôme", async () => {
    mockGetServerSession.mockResolvedValue({
      user: createDepartementalAgent(["75"]),
    });

    const response = await proxy(
      new NextRequest("http://localhost/api/statistiques")
    );

    expect(response.status).toBe(200);
  });

  it("redirige un utilisateur opérateur du tableau de bord vers les structures", async () => {
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({
        operateurId: 42,
        isAgent: false,
        grants: [createSessionGrant({ isNational: true })],
      }),
    });

    const response = await proxy(new NextRequest("http://localhost/"));

    expect(response.headers.get("location")).toBe(
      "http://localhost/structures"
    );
  });

  it("redirige un utilisateur opérateur vers la 404 sur une page réservée aux agents", async () => {
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({
        operateurId: 42,
        isAgent: false,
        grants: [createSessionGrant({ isNational: true })],
      }),
    });

    const response = await proxy(new NextRequest("http://localhost/cpoms"));

    expect(response.headers.get("location")).toBe("http://localhost/404");
  });

  it("intercepte chaque page déclarée comme protégée", () => {
    const ignored = protectedPages.filter(
      (page) =>
        !config.matcher.some(
          (entry) => entry === page || entry === `${page}/:path*`
        )
    );

    expect(ignored).toEqual([]);
  });

  it("refuse sans session chaque route d'API non publique", async () => {
    const privateApiRoutes = listApiRoutes().filter(
      (pathname) => !isPublicApiRoute(pathname)
    );

    const statuses = await Promise.all(
      privateApiRoutes.map(async (pathname) => {
        const response = await proxy(
          new NextRequest(`http://localhost${pathname}`)
        );
        return `${pathname} → ${response.status}`;
      })
    );

    expect(statuses).toEqual(
      privateApiRoutes.map((pathname) => `${pathname} → 401`)
    );
  });

  it("laisse passer sans session les routes d'API publiques", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/api/auth/session")
    );

    expect(response.status).toBe(200);
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

const isPublicApiRoute = (pathname: string): boolean =>
  publicApiRoutes.some((route) => matchesPath(pathname, route));
