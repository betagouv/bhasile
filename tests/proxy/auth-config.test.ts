import { globSync, readFileSync } from "node:fs";

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";
import {
  passwordProtectedPages,
  protectedApiRoutes,
  publicPages,
} from "@/proxy/auth-config";
import { getApiRouteProtection } from "@/proxy/auth-util";
import { Protection } from "@/types/proxy.type";

const PAGES_AUTHENTIFIEES_VOLONTAIREMENT_PUBLIQUES = ["/deconnexion"];

const API_PROTECTIONS_ATTENDUES: Record<
  string,
  Record<string, Protection>
> = {
  "/api/activites/stats": { GET: "proconnect" },
  "/api/auth/nextauth": { GET: "none", POST: "none" },
  "/api/cpoms": { GET: "proconnect", POST: "proconnect" },
  "/api/cpoms/1": { GET: "proconnect", PUT: "proconnect" },
  "/api/dna-codes": { GET: "either" },
  "/api/files": { POST: "either" },
  "/api/files/1": { GET: "either", DELETE: "either" },
  "/api/metabase": { GET: "none" },
  "/api/operateurs": { GET: "proconnect" },
  "/api/operateurs/1": { GET: "proconnect", PUT: "proconnect" },
  "/api/operateurs/suggestions": { GET: "either" },
  "/api/statistiques": { GET: "proconnect" },
  "/api/statistiques/cartographie": { GET: "proconnect" },
  "/api/structures": { GET: "either", POST: "password" },
  "/api/structures/1": { GET: "either", PUT: "either" },
  "/api/structures/1/actualisation": { PUT: "proconnect" },
  "/api/structures/1/adresses": { HEAD: "password" },
  "/api/structures/stats": { GET: "proconnect" },
  "/api/transformations": { POST: "proconnect" },
  "/api/transformations/1": {
    GET: "proconnect",
    PUT: "proconnect",
    DELETE: "proconnect",
  },
  "/api/transformations/1/selection": { PUT: "proconnect" },
};

describe("couverture du proxy sur les pages", () => {
  it("fait passer toutes les pages de l'application par le proxy", () => {
    for (const page of getPages()) {
      expect(
        unstable_doesMiddlewareMatch({ config, url: page.pathname }),
        `${page.filePath} n'est pas couvert par le matcher`
      ).toBe(true);
    }
  });

  it("exclut les assets statiques et les routes internes de Next", () => {
    const cheminsNonApplicatifs = [
      "/_next/static/chunk.js",
      "/_next/image",
      "/logo.svg",
      "/favicon.ico",
      "/adresses-diffus.xlsx",
    ];

    for (const chemin of cheminsNonApplicatifs) {
      expect(
        unstable_doesMiddlewareMatch({ config, url: chemin }),
        `${chemin} ne devrait pas déclencher le proxy`
      ).toBe(false);
    }
  });

  it("déclare publiques toutes les pages de (not-authenticated)", () => {
    for (const page of getPages("(not-authenticated)")) {
      expect(
        publicPages,
        `${page.filePath} est une page publique absente de publicPages`
      ).toContain(getPremierSegment(page.pathname));
    }
  });

  it("ne déclare publique aucune page de (authenticated) hors exceptions", () => {
    for (const page of getPages("(authenticated)")) {
      const segment = getPremierSegment(page.pathname);
      if (PAGES_AUTHENTIFIEES_VOLONTAIREMENT_PUBLIQUES.includes(segment)) {
        continue;
      }
      expect(
        publicPages,
        `${page.filePath} est authentifiée mais déclarée publique`
      ).not.toContain(segment);
    }
  });

  it("garde /deconnexion publique, sinon la session ProConnect n'est jamais fermée", () => {
    expect(publicPages).toContain("/deconnexion");
  });

  it("déclare toutes les pages de (password-protected) dans une des deux listes", () => {
    for (const page of getPages("(password-protected)")) {
      const segment = getPremierSegment(page.pathname);
      expect(
        [...passwordProtectedPages, ...publicPages],
        `${page.filePath} n'est ni protégée par mot de passe ni publique`
      ).toContain(segment);
    }
  });
});

describe("protection des routes API", () => {
  const routesSurDisque = getApiRoutes();

  it("déclare une protection attendue pour chaque route API du disque", () => {
    for (const route of routesSurDisque) {
      expect(
        Object.keys(API_PROTECTIONS_ATTENDUES),
        `${route.filePath} n'a pas d'intention déclarée dans le test`
      ).toContain(route.pathname);
    }
  });

  it("ne déclare aucune protection pour une route qui n'existe plus", () => {
    const cheminsSurDisque = routesSurDisque.map((route) => route.pathname);
    for (const chemin of Object.keys(API_PROTECTIONS_ATTENDUES)) {
      expect(cheminsSurDisque, `${chemin} n'existe pas sur le disque`).toContain(
        chemin
      );
    }
  });

  it("couvre exactement les méthodes HTTP exportées par chaque route", () => {
    for (const route of routesSurDisque) {
      const methodesAttendues = Object.keys(
        API_PROTECTIONS_ATTENDUES[route.pathname] ?? {}
      );
      expect(methodesAttendues.sort(), route.filePath).toEqual(
        route.methods.sort()
      );
    }
  });

  it("résout la protection déclarée, sans masquage entre patterns", () => {
    for (const [pathname, methodes] of Object.entries(
      API_PROTECTIONS_ATTENDUES
    )) {
      for (const [method, protectionAttendue] of Object.entries(methodes)) {
        expect(
          getApiRouteProtection(buildRequest(pathname, { method }), pathname),
          `${method} ${pathname}`
        ).toBe(protectionAttendue);
      }
    }
  });

  it("n'a aucun pattern qui ne corresponde à plus aucune route", () => {
    for (const { pattern } of protectedApiRoutes) {
      expect(
        Object.keys(API_PROTECTIONS_ATTENDUES).some((pathname) =>
          pattern.test(pathname)
        ),
        `${pattern} ne correspond à aucune route`
      ).toBe(true);
    }
  });

  it("refuse une route API inconnue", () => {
    const pathname = "/api/inconnue";
    expect(
      getApiRouteProtection(buildRequest(pathname, { method: "GET" }), pathname)
    ).toBeNull();
  });

  it("refuse un identifiant non numérique sur une route à identifiant", () => {
    const pathname = "/api/structures/abc";
    expect(
      getApiRouteProtection(buildRequest(pathname, { method: "GET" }), pathname)
    ).toBeNull();
  });
});

describe("bypass d'authentification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ignore DEV_AUTH_BYPASS en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    vi.stubEnv("AUTH_SECRET", "secret-de-test");

    const response = await proxy(buildRequest("/cpoms"));

    expect(response.headers.get("location")).toContain("/connexion");
  });

  it("ignore l'en-tête x-dev-auth-bypass en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_BYPASS", "");
    vi.stubEnv("AUTH_SECRET", "secret-de-test");

    const response = await proxy(
      buildRequest("/cpoms", { headers: { "x-dev-auth-bypass": "1" } })
    );

    expect(response.headers.get("location")).toContain("/connexion");
  });

  it("applique DEV_AUTH_BYPASS hors production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_BYPASS", "1");

    const response = await proxy(buildRequest("/cpoms"));

    expect(response.headers.get("location")).toBeNull();
  });
});

type RouteSurDisque = {
  filePath: string;
  pathname: string;
  methods: string[];
};

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const buildRequest = (
  pathname: string,
  init?: ConstructorParameters<typeof NextRequest>[1]
): NextRequest =>
  new NextRequest(new URL(pathname, "http://localhost:3000"), init);

const getPremierSegment = (pathname: string): string =>
  `/${pathname.split("/")[1] ?? ""}`;

const toPathname = (filePath: string): string => {
  const pathname = filePath
    .replace(/^src\/app/, "")
    .replace(/\/(page|route)\.tsx?$/, "")
    .replace(/\/\([^/]+\)/g, "")
    .replace(/\[\.\.\.([^\]]+)\]/g, "$1")
    .replace(/\[[^\]]+\]/g, "1");
  return pathname === "" ? "/" : pathname;
};

const getPages = (routeGroup?: string): { filePath: string; pathname: string }[] =>
  globSync("src/app/**/page.tsx")
    .filter((filePath) => !routeGroup || filePath.includes(routeGroup))
    .map((filePath) => ({ filePath, pathname: toPathname(filePath) }));

const getApiRoutes = (): RouteSurDisque[] =>
  globSync("src/app/api/**/route.ts").map((filePath) => {
    const fileContent = readFileSync(filePath, "utf8");
    return {
      filePath,
      pathname: toPathname(filePath),
      methods: HTTP_METHODS.filter(
        (method) =>
          new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${method}\\b`).test(
            fileContent
          ) || new RegExp(`\\bas\\s+${method}\\b`).test(fileContent)
      ),
    };
  });
