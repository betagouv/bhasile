import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertCampaignOpen,
  buildNotificationParams,
  getMessageRecipients,
  getOpenCampaignYears,
  getSelectableCampaignYears,
  isCampaignOpen,
} from "@/app/api/tarifications/tarification.util";
import type { GrantDb } from "@/app/api/users/user.db.type";
import { AccessRole, GrantScope, Visibility } from "@/generated/prisma/enums";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2027,
  };
});

describe("getOpenCampaignYears", () => {
  it("ouvre la campagne de l'année et celle de l'année suivante", () => {
    expect(getOpenCampaignYears()).toEqual([2027, 2028]);
  });
});

describe("getSelectableCampaignYears", () => {
  it("propose les campagnes ouvertes et les campagnes passées qui ont des échanges, de la plus récente à la plus ancienne", () => {
    expect(getSelectableCampaignYears([2025, 2027])).toEqual([
      2028, 2027, 2025,
    ]);
  });

  it("propose seulement les campagnes ouvertes sans échange passé", () => {
    expect(getSelectableCampaignYears([])).toEqual([2028, 2027]);
  });
});

describe("isCampaignOpen", () => {
  it("considère ouvertes les campagnes de l'année et de l'année suivante", () => {
    expect(isCampaignOpen(2027)).toBe(true);
    expect(isCampaignOpen(2028)).toBe(true);
  });

  it("considère fermées les campagnes passées et trop lointaines", () => {
    expect(isCampaignOpen(2026)).toBe(false);
    expect(isCampaignOpen(2029)).toBe(false);
  });
});

describe("assertCampaignOpen", () => {
  it("rejette l'écriture dans une campagne passée", () => {
    expect(() => assertCampaignOpen(2026)).toThrow("lecture seule");
  });
});

describe("getMessageRecipients", () => {
  const structure = { id: 42, departementAdministratif: "35" };
  const buildGrant = (overrides: Partial<GrantDb>): GrantDb => ({
    role: AccessRole.EDITEUR,
    scope: GrantScope.DEPARTEMENT,
    region: null,
    departement: { numero: "35", name: "Ille-et-Vilaine", regionId: 53 },
    structure: null,
    ...overrides,
  });
  const buildUser = (
    id: number,
    overrides: Partial<Parameters<typeof getMessageRecipients>[0][number]> = {}
  ) => ({
    id,
    email: `agent${id}@ille-et-vilaine.gouv.fr`,
    operateurId: null,
    isSuperAdmin: false,
    isAgent: true,
    grants: [],
    emailPattern: { isAgent: true, grants: [buildGrant({})] },
    ...overrides,
  });
  const getRecipientIds = (
    users: Parameters<typeof getMessageRecipients>[0],
    authorId = 1
  ) =>
    getMessageRecipients(users, { structure, authorId }).map(
      (recipient) => recipient.userId
    );

  it("notifie les agents éditeurs du département, par leur pattern d'email, sauf l'auteur", () => {
    expect(getRecipientIds([buildUser(1), buildUser(2), buildUser(3)])).toEqual(
      [2, 3]
    );
  });

  it("notifie un agent éditeur de la seule structure", () => {
    const structureEditor = buildUser(2, {
      grants: [
        buildGrant({
          scope: GrantScope.STRUCTURE,
          departement: null,
          structure: { id: 42, codeBhasile: "C42" },
        }),
      ],
      emailPattern: null,
    });

    expect(getRecipientIds([structureEditor])).toEqual([2]);
  });

  it("ne notifie pas un agent dont les droits personnels portent sur une autre structure, malgré son pattern", () => {
    const elsewhereEditor = buildUser(2, {
      grants: [
        buildGrant({
          scope: GrantScope.STRUCTURE,
          departement: null,
          structure: { id: 7, codeBhasile: "C7" },
        }),
      ],
    });

    expect(getRecipientIds([elsewhereEditor])).toEqual([]);
  });

  it("ne notifie ni les lecteurs, ni les agents régionaux, ni un autre département", () => {
    const users = [
      buildUser(2, {
        emailPattern: {
          isAgent: true,
          grants: [buildGrant({ role: AccessRole.LECTEUR })],
        },
      }),
      buildUser(3, {
        emailPattern: {
          isAgent: true,
          grants: [
            buildGrant({
              scope: GrantScope.REGION,
              departement: null,
              region: {
                id: 53,
                name: "Bretagne",
                departements: [{ numero: "35" }],
              },
            }),
          ],
        },
      }),
      buildUser(4, {
        emailPattern: {
          isAgent: true,
          grants: [
            buildGrant({
              departement: {
                numero: "22",
                name: "Côtes-d'Armor",
                regionId: 53,
              },
            }),
          ],
        },
      }),
    ];

    expect(getRecipientIds(users)).toEqual([]);
  });

  it("notifie un administrateur du département", () => {
    expect(
      getRecipientIds([
        buildUser(2, {
          emailPattern: {
            isAgent: true,
            grants: [buildGrant({ role: AccessRole.ADMIN })],
          },
        }),
      ])
    ).toEqual([2]);
  });

  it("ne notifie ni les superadmins, ni les utilisateurs d'un opérateur, ni les non-agents", () => {
    const users = [
      buildUser(2, { isSuperAdmin: true }),
      buildUser(3, { operateurId: 9, isAgent: null }),
      buildUser(4, { isAgent: false }),
    ];

    expect(getRecipientIds(users)).toEqual([]);
  });
});

describe("buildNotificationParams", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("pointe vers le canal agents de la tarification de la structure", () => {
    vi.stubEnv("NEXT_URL", "https://bhasile.test");

    expect(
      buildNotificationParams({
        structure: { id: 42, codeBhasile: "C42" },
        year: 2027,
        visibility: Visibility.AGENTS,
      })
    ).toEqual({
      structure: "C42",
      campagne: "2027",
      canal: "Services de l’État seulement",
      lien: "https://bhasile.test/structures/42/tarification/2027?canal=agents",
    });
  });

  it("pointe vers le canal partagé sans paramètre de canal", () => {
    vi.stubEnv("NEXT_URL", "https://bhasile.test");

    expect(
      buildNotificationParams({
        structure: { id: 42, codeBhasile: "C42" },
        year: 2027,
        visibility: Visibility.SHARED,
      }).lien
    ).toBe("https://bhasile.test/structures/42/tarification/2027");
  });
});
