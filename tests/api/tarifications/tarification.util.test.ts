import {
  createDepartementPerimeter,
  createGrantDb,
  createNationalPerimeter,
  createRegionPerimeter,
  createUserWithGrants,
} from "tests/test-utils/factories/user-with-grants.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertCampaignOpen,
  buildNotificationParams,
  getMessageRecipients,
  getOpenCampaignYears,
  getSelectableCampaignYears,
  isCampaignOpen,
  isNotificationHour,
} from "@/app/api/tarifications/tarification.util";
import { GrantScope, Visibility } from "@/generated/prisma/enums";

vi.mock("@/app/utils/now.util", async () => {
  const actual = await vi.importActual("@/app/utils/now.util");
  return { ...actual, getCurrentYear: () => 2027 };
});

describe("isNotificationHour", () => {
  it("garde 8 h et 14 h à Paris l'hiver, soit 7 h et 13 h UTC", () => {
    expect(isNotificationHour(new Date("2027-01-15T07:00:00Z"))).toBe(true);
    expect(isNotificationHour(new Date("2027-01-15T13:00:00Z"))).toBe(true);
    expect(isNotificationHour(new Date("2027-01-15T06:00:00Z"))).toBe(false);
    expect(isNotificationHour(new Date("2027-01-15T12:00:00Z"))).toBe(false);
  });

  it("garde 8 h et 14 h à Paris l'été, soit 6 h et 12 h UTC", () => {
    expect(isNotificationHour(new Date("2027-07-15T06:00:00Z"))).toBe(true);
    expect(isNotificationHour(new Date("2027-07-15T12:00:00Z"))).toBe(true);
    expect(isNotificationHour(new Date("2027-07-15T07:00:00Z"))).toBe(false);
    expect(isNotificationHour(new Date("2027-07-15T13:00:00Z"))).toBe(false);
  });
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
  beforeEach(() => {
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  const buildUser = (
    id: number,
    overrides: Partial<Parameters<typeof getMessageRecipients>[0][number]> = {}
  ) => ({
    ...createUserWithGrants({
      id,
      perimeter: createDepartementPerimeter("35", "Ille-et-Vilaine"),
      ...overrides,
    }),
    email: `agent${id}@ille-et-vilaine.gouv.fr`,
  });
  const getRecipientIds = (
    users: Parameters<typeof getMessageRecipients>[0],
    authorId = 1
  ) =>
    getMessageRecipients(users, { structure, authorId }).map(
      (recipient) => recipient.userId
    );

  it("notifie les agents du périmètre du département, sauf l'auteur", () => {
    expect(getRecipientIds([buildUser(1), buildUser(2), buildUser(3)])).toEqual(
      [2, 3]
    );
  });

  it("ne notifie ni les agents régionaux, ni nationaux, ni d'un autre département", () => {
    const users = [
      buildUser(2, { perimeter: createRegionPerimeter() }),
      buildUser(3, { perimeter: createNationalPerimeter() }),
      buildUser(4, {
        perimeter: createDepartementPerimeter("22", "Côtes-d'Armor"),
      }),
    ];

    expect(getRecipientIds(users)).toEqual([]);
  });

  it("ne notifie pas un agent dont le compte n'est pas activé", () => {
    expect(
      getRecipientIds([
        buildUser(2, { isActivated: false, deactivatedAt: new Date() }),
      ])
    ).toEqual([]);
  });

  it("ne notifie personne tant que la messagerie est fermée", () => {
    vi.stubEnv("MESSAGERIE_ENABLED", "");

    expect(getRecipientIds([buildUser(2)])).toEqual([]);
  });

  it("ne notifie ni les superadmins, ni les utilisateurs d'un opérateur, ni les non-agents", () => {
    const users = [
      buildUser(2, { isSuperAdmin: true }),
      buildUser(3, {
        operateurId: 9,
        perimeter: null,
        grants: [
          createGrantDb({
            scope: GrantScope.STRUCTURE,
            structure: { id: 42, codeBhasile: "C42" },
          }),
        ],
      }),
      buildUser(4, { perimeter: null }),
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

  it("échoue sans NEXT_URL plutôt que d'envoyer un lien cassé", () => {
    vi.stubEnv("NEXT_URL", "");

    expect(() =>
      buildNotificationParams({
        structure: { id: 42, codeBhasile: "C42" },
        year: 2027,
        visibility: Visibility.SHARED,
      })
    ).toThrow("NEXT_URL");
  });
});
