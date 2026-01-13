import { ApiRoute } from "./types/proxy.type";

export const protectedApiRoutes: ApiRoute[] = [
  {
    pattern: /^\/api\/structures$/,
    routes: {
      GET: "either",
      PUT: "either",
      POST: "password",
    },
  },
  {
    pattern: /^\/api\/structures\/[^/]+$/,
    routes: {
      GET: "proconnect",
    },
  },
  {
    pattern: /^\/api\/structures\/[^/]+\/adresses$/,
    routes: {
      HEAD: "password",
    },
  },
  {
    pattern: /^\/api\/structures\/dna\/[^/]+$/,
    routes: {
      GET: "password",
    },
  },
  {
    pattern: /^\/api\/files\/[^/]+$/,
    routes: {
      GET: "either",
      DELETE: "either",
    },
  },
  {
    pattern: /^\/api\/files$/,
    routes: {
      POST: "either",
    },
  },
  {
    pattern: /^\/api\/operateurs$/,
    routes: {
      GET: "either",
    },
  },
  {
    pattern: /^\/api\/structures\/stats$/,
    routes: {
      GET: "proconnect",
      POST: "proconnect",
    },
  },
  {
    pattern: /^\/api\/structures-ofii$/,
    routes: {
      GET: "either",
      POST: "either",
    },
  },
  {
    pattern: /^\/api\/auth(?:\/.*)?$/,
    routes: {
      GET: "none",
      POST: "none",
    },
  },
  {
    pattern: /^\/api\/metabase$/,
    routes: {
      GET: "none",
    },
  },
];

export const proConnectProtectedPages = [
  "/structures",
  "/operateurs",
  "/statistiques",
];

export const passwordProtectedPages = ["/ajout-structure", "/ajout-adresses"];

export const noProtectionPage = "/mot-de-passe";
