import {
  AGENTS_DOCUMENT_COLUMNS,
  DocumentPerimeter,
  findEmailCaseDuplicates,
  getMissingColumns,
  parseAgentsDocument,
  planAgentsReset,
  planPerimeters,
  ResetUser,
} from "scripts/utils/agents-reset.util";

import { GrantDb } from "@/app/api/users/user.db.type";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

const REGION_LEVEL = "Une région (accès DREETS - DRIHL - SGAR)";
const DEPARTEMENT_LEVEL = "Un département (accès DDETS - UD-DD)";

const referential = {
  regions: [
    { id: 1, name: "Bretagne" },
    { id: 2, name: "Provence-Alpes-Côte d'Azur" },
  ],
  departements: [
    { numero: "29", name: "Finistère" },
    { numero: "35", name: "Ille-et-Vilaine" },
  ],
};

const [firstEmailColumn, secondEmailColumn] = AGENTS_DOCUMENT_COLUMNS.emails;

const buildRow = ({
  level = DEPARTEMENT_LEVEL,
  departement = "",
  region = "",
  name = "DDETS Finistère",
  emails = ["agent@finistere.gouv.fr"],
}: {
  level?: string;
  departement?: string;
  region?: string;
  name?: string;
  emails?: string[];
}): Record<string, string> => ({
  [AGENTS_DOCUMENT_COLUMNS.level]: level,
  [AGENTS_DOCUMENT_COLUMNS.departement]: departement,
  [AGENTS_DOCUMENT_COLUMNS.region]: region,
  [AGENTS_DOCUMENT_COLUMNS.perimeterName]: name,
  ...Object.fromEntries(
    AGENTS_DOCUMENT_COLUMNS.emails.map((column, index) => [
      column,
      emails[index] ?? "",
    ])
  ),
});

const finistereZone = {
  scope: GrantScope.DEPARTEMENT,
  regionId: null,
  departementNumero: "29",
  label: "29 - Finistère",
} as const;

const buildPerimeter = (
  overrides: Partial<DocumentPerimeter> = {}
): DocumentPerimeter => ({
  name: "DDETS Finistère",
  zone: finistereZone,
  emails: ["agent@finistere.gouv.fr"],
  line: 2,
  ...overrides,
});

const nationalReadGrant: GrantDb = {
  role: AccessRole.LECTEUR,
  scope: GrantScope.NATIONAL,
  region: null,
  departement: null,
  structure: null,
};

const departementEditGrant = (numero: string, name: string): GrantDb => ({
  role: AccessRole.EDITEUR,
  scope: GrantScope.DEPARTEMENT,
  region: null,
  departement: { numero, name, regionId: 1 },
  structure: null,
});

const nationalEditGrant: GrantDb = {
  ...nationalReadGrant,
  role: AccessRole.EDITEUR,
};

const buildUser = (overrides: Partial<ResetUser> = {}): ResetUser => ({
  id: 1,
  email: "agent@finistere.gouv.fr",
  isSuperAdmin: false,
  isAgent: true,
  operateurId: null,
  isActivated: false,
  deactivatedAt: null,
  lastConnection: null,
  perimeter: null,
  grants: [],
  emailPattern: null,
  ...overrides,
});

describe("getMissingColumns", () => {
  it("liste les colonnes attendues absentes du document", () => {
    const headers = Object.keys(buildRow({})).filter(
      (header) => header !== AGENTS_DOCUMENT_COLUMNS.perimeterName
    );

    expect(getMissingColumns(headers)).toEqual([
      AGENTS_DOCUMENT_COLUMNS.perimeterName,
    ]);
  });
});

describe("parseAgentsDocument", () => {
  it("résout un département par son numéro et nettoie les adresses", () => {
    const { perimeters, errors } = parseAgentsDocument(
      [
        buildRow({
          departement: "29 - Finistère",
          emails: ["  Agent@Finistere.GOUV.fr ", "", "autre@finistere.gouv.fr"],
        }),
      ],
      referential
    );

    expect(errors).toEqual([]);
    expect(perimeters).toEqual([
      buildPerimeter({
        emails: ["agent@finistere.gouv.fr", "autre@finistere.gouv.fr"],
      }),
    ]);
  });

  it("résout une région malgré une apostrophe typographique", () => {
    const { perimeters, errors } = parseAgentsDocument(
      [
        buildRow({
          level: REGION_LEVEL,
          region: "Provence-Alpes-Côte d’Azur",
          name: "DREETS PACA",
        }),
      ],
      referential
    );

    expect(errors).toEqual([]);
    expect(perimeters[0].zone).toEqual({
      scope: GrantScope.REGION,
      regionId: 2,
      departementNumero: null,
      label: "Provence-Alpes-Côte d'Azur",
    });
  });

  it("signale une adresse présente sur plusieurs lignes, casse comprise", () => {
    const { errors } = parseAgentsDocument(
      [
        buildRow({ departement: "29 - Finistère" }),
        buildRow({
          departement: "35 - Ille-et-Vilaine",
          name: "DDETS Ille-et-Vilaine",
          emails: ["AGENT@finistere.gouv.fr"],
        }),
      ],
      referential
    );

    expect(errors).toEqual([
      "agent@finistere.gouv.fr présent plusieurs fois (lignes 2, 3)",
    ]);
  });

  it("signale un rôle présent plusieurs fois", () => {
    const { errors } = parseAgentsDocument(
      [
        buildRow({ departement: "29 - Finistère" }),
        buildRow({
          departement: "29 - Finistère",
          emails: ["autre@finistere.gouv.fr"],
        }),
      ],
      referential
    );

    expect(errors).toEqual([
      "rôle « DDETS Finistère » présent plusieurs fois (lignes 2, 3)",
    ]);
  });

  it("accepte deux rôles sur la même zone", () => {
    const { errors } = parseAgentsDocument(
      [
        buildRow({ level: REGION_LEVEL, region: "Bretagne", name: "DREETS" }),
        buildRow({
          level: REGION_LEVEL,
          region: "Bretagne",
          name: "SGAR",
          emails: ["sgar@bretagne.gouv.fr"],
        }),
      ],
      referential
    );

    expect(errors).toEqual([]);
  });

  it("signale un niveau, une zone, un nom ou une adresse invalides", () => {
    const { errors } = parseAgentsDocument(
      [
        buildRow({ level: "Un pays" }),
        buildRow({ departement: "99 - Inconnu", name: "Rôle 2" }),
        buildRow({
          departement: "29 - Finistère",
          name: "",
          emails: ["pas-une-adresse"],
        }),
        buildRow({ departement: "35", name: "Rôle 4", emails: [] }),
      ],
      referential
    );

    expect(errors).toEqual([
      "ligne 2 (DDETS Finistère) : niveau inconnu « Un pays »",
      "ligne 3 (Rôle 2) : zone introuvable « 99 - Inconnu »",
      "ligne 4 (rôle sans nom) : nom du rôle manquant",
      "ligne 4 (rôle sans nom) : adresse mail invalide « pas-une-adresse »",
      "ligne 5 (Rôle 4) : aucune adresse mail",
    ]);
  });

  it("lit toutes les colonnes d'adresses", () => {
    const row = buildRow({ departement: "29 - Finistère" });
    row[secondEmailColumn] = "second@finistere.gouv.fr";
    row[firstEmailColumn] = "";

    const { perimeters } = parseAgentsDocument([row], referential);

    expect(perimeters[0].emails).toEqual(["second@finistere.gouv.fr"]);
  });
});

describe("findEmailCaseDuplicates", () => {
  it("regroupe les adresses qui ne diffèrent que par la casse", () => {
    expect(
      findEmailCaseDuplicates([
        { email: "Jean.Dupont@x.fr" },
        { email: "jean.dupont@x.fr" },
        { email: "autre@x.fr" },
      ])
    ).toEqual([["Jean.Dupont@x.fr", "jean.dupont@x.fr"]]);
  });
});

describe("planPerimeters", () => {
  it("distingue les périmètres créés, déplacés, inchangés et absents", () => {
    const plan = planPerimeters(
      [
        buildPerimeter(),
        buildPerimeter({ name: "DDETS Ille-et-Vilaine" }),
        buildPerimeter({ name: "Nouveau" }),
      ],
      [
        {
          name: "DDETS Finistère",
          scope: GrantScope.DEPARTEMENT,
          regionId: null,
          departementNumero: "29",
        },
        {
          name: "DDETS Ille-et-Vilaine",
          scope: GrantScope.DEPARTEMENT,
          regionId: null,
          departementNumero: "35",
        },
        {
          name: "Ancien",
          scope: GrantScope.NATIONAL,
          regionId: null,
          departementNumero: null,
        },
      ]
    );

    expect(plan.created.map(({ name }) => name)).toEqual(["Nouveau"]);
    expect(plan.zoneChanged.map(({ name }) => name)).toEqual([
      "DDETS Ille-et-Vilaine",
    ]);
    expect(plan.unchanged.map(({ name }) => name)).toEqual(["DDETS Finistère"]);
    expect(plan.absent).toEqual(["Ancien"]);
  });
});

describe("planAgentsReset", () => {
  it("crée le compte d'un agent absent de la base", () => {
    const plan = planAgentsReset([buildPerimeter()], []);

    expect(plan.agents).toMatchObject([
      { email: "agent@finistere.gouv.fr", status: "CREATED", user: null },
    ]);
  });

  it("retrouve un user existant sans tenir compte de la casse", () => {
    const user = buildUser({
      email: "Agent@Finistere.gouv.fr",
      grants: [nationalReadGrant, departementEditGrant("29", "Finistère")],
    });

    const plan = planAgentsReset([buildPerimeter()], [user]);

    expect(plan.agents).toMatchObject([{ user, status: "SAME_RIGHTS" }]);
  });

  it("signale des droits différents quand la zone change", () => {
    const user = buildUser({
      grants: [
        nationalReadGrant,
        departementEditGrant("29", "Finistère"),
        departementEditGrant("35", "Ille-et-Vilaine"),
      ],
    });

    const [agent] = planAgentsReset([buildPerimeter()], [user]).agents;

    expect(agent.status).toBe("DIFFERENT_RIGHTS");
    expect(agent.rightsBefore).toBe(
      "Lecteur national + Éditeur 29 - Finistère + Éditeur 35 - Ille-et-Vilaine"
    );
    expect(agent.rightsAfter).toBe("Lecteur national + Admin 29 - Finistère");
  });

  it("reprend les droits du pattern d'email quand le user n'a pas de binôme", () => {
    const user = buildUser({
      isAgent: null,
      emailPattern: {
        isAgent: true,
        grants: [nationalReadGrant, departementEditGrant("29", "Finistère")],
      },
    });

    const plan = planAgentsReset([buildPerimeter()], [user]);

    expect(plan.agents[0].status).toBe("SAME_RIGHTS");
  });

  it("désactive un agent absent du document en signalant les nationaux", () => {
    const national = buildUser({
      id: 2,
      email: "national@interieur.gouv.fr",
      grants: [nationalEditGrant],
    });

    const plan = planAgentsReset([buildPerimeter()], [national]);

    expect(plan.deactivated).toEqual([
      { user: national, rights: "Éditeur national", isNational: true },
    ]);
    expect(plan.warnings).toEqual([
      "national@interieur.gouv.fr (Éditeur national) est national et absent du document : il sera désactivé",
    ]);
  });

  it("désactive un user activé lors d'un passage précédent puis retiré du document", () => {
    const user = buildUser({
      id: 2,
      email: "parti@finistere.gouv.fr",
      isActivated: true,
      perimeter: { name: "DDETS Finistère" },
    });

    const plan = planAgentsReset([buildPerimeter()], [user]);

    expect(plan.deactivated).toMatchObject([{ user, isNational: false }]);
  });

  it("laisse en attente un user sans aucun accès", () => {
    const user = buildUser({
      id: 2,
      email: "inconnu@gmail.com",
      isAgent: null,
    });

    const plan = planAgentsReset([buildPerimeter()], [user]);

    expect(plan.deactivated).toEqual([]);
    expect(plan.pendingCount).toBe(1);
  });

  it("ne touche pas aux superadmins, même présents dans le document", () => {
    const superAdmin = buildUser({ isSuperAdmin: true });
    const otherSuperAdmin = buildUser({
      id: 2,
      email: "admin@beta.gouv.fr",
      isSuperAdmin: true,
    });

    const plan = planAgentsReset(
      [buildPerimeter()],
      [superAdmin, otherSuperAdmin]
    );

    expect(plan.agents).toEqual([]);
    expect(plan.superAdmins).toEqual([otherSuperAdmin]);
    expect(plan.warnings).toEqual([
      "agent@finistere.gouv.fr est superadmin : ignoré dans « DDETS Finistère », reste superadmin",
    ]);
  });

  it("refuse de rattacher un user opérateur à un périmètre", () => {
    const plan = planAgentsReset(
      [buildPerimeter()],
      [buildUser({ operateurId: 3 })]
    );

    expect(plan.errors).toEqual([
      "agent@finistere.gouv.fr est rattaché à un opérateur et ne peut pas rejoindre « DDETS Finistère »",
    ]);
  });
});
