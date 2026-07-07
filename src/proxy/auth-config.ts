import { ApiRoute } from "../types/proxy.type";

export const protectedApiRoutes: ApiRoute[] = [
  {
    pattern: /^\/api\/structures$/,
    routes: {
      GET: "either",
      POST: "password",
    },
  },
  {
    pattern: /^\/api\/structures\/[^/]+$/,
    routes: {
      GET: "either",
      PUT: "either",
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
    pattern: /^\/api\/cpoms$/,
    routes: {
      GET: "proconnect",
      POST: "proconnect",
    },
  },
  {
    pattern: /^\/api\/cpoms\/[^/]+$/,
    routes: {
      GET: "proconnect",
      PUT: "proconnect",
    },
  },
  {
    pattern: /^\/api\/dna-codes$/,
    routes: {
      GET: "either",
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
    pattern: /^\/api\/operateurs\/suggestions$/,
    routes: {
      GET: "either",
    },
  },
  {
    pattern: /^\/api\/operateurs$/,
    routes: {
      GET: "proconnect",
    },
  },
  {
    pattern: /^\/api\/operateurs\/[^/]+$/,
    routes: {
      GET: "proconnect",
      PUT: "proconnect",
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
    pattern: /^\/api\/activites\/stats$/,
    routes: {
      GET: "proconnect",
    },
  },
  {
    pattern: /^\/api\/statistiques$/,
    routes: {
      GET: "proconnect",
    },
  },
  {
    pattern: /^\/api\/statistiques\/cartographie$/,
    routes: {
      GET: "proconnect",
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
  {
    pattern: /^\/api\/transformations$/,
    routes: {
      GET: "proconnect",
      POST: "proconnect",
    },
  },
  {
    pattern: /^\/api\/transformations\/[^/]+$/,
    routes: {
      GET: "proconnect",
      PUT: "proconnect",
      DELETE: "proconnect",
    },
  },
  {
    pattern: /^\/api\/transformations\/[^/]+\/selection$/,
    routes: {
      PUT: "proconnect",
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
