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
    pattern: /^\/api\/structures\/\d+$/,
    routes: {
      GET: "either",
      PUT: "either",
    },
  },
  {
    pattern: /^\/api\/structures\/\d+\/actualisation$/,
    routes: {
      PUT: "proconnect",
    },
  },
  {
    pattern: /^\/api\/structures\/\d+\/adresses$/,
    routes: {
      HEAD: "password",
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
    pattern: /^\/api\/cpoms\/\d+$/,
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
    pattern: /^\/api\/operateurs\/\d+$/,
    routes: {
      GET: "proconnect",
      PUT: "proconnect",
    },
  },
  {
    pattern: /^\/api\/structures\/stats$/,
    routes: {
      GET: "proconnect",
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
      POST: "proconnect",
    },
  },
  {
    pattern: /^\/api\/transformations\/\d+$/,
    routes: {
      GET: "proconnect",
      PUT: "proconnect",
      DELETE: "proconnect",
    },
  },
  {
    pattern: /^\/api\/transformations\/\d+\/selection$/,
    routes: {
      PUT: "proconnect",
    },
  },
];

export const passwordProtectedPages = ["/ajout-structure", "/ajout-adresses"];

export const noProtectionPage = "/mot-de-passe";

/** Le proxy est fail-closed : toute page absente de cette liste exige une
 *  session ProConnect. Y ajouter une entrée rend la page publique. */
export const publicPages = [
  "/accessibilite",
  "/cgu",
  "/connexion",
  // Déconnexion OIDC en deux temps : /deconnexion/proconnect s'exécute après la
  // suppression de la session, la protéger empêcherait la fin de session ProConnect.
  "/deconnexion",
  "/mentions-legales",
  "/politique-confidentialite",
  "/usage",
  noProtectionPage,
];
