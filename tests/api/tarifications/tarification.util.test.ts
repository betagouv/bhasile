import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertCampaignOpen,
  assertStructureEligible,
  buildNotificationParams,
  getMessageRecipients,
  getSelectableCampaignYears,
  isNotificationHour,
} from "@/app/api/tarifications/tarification.util";
import type { GrantDb } from "@/app/api/users/user.db.type";
import {
  AccessRole,
  GrantScope,
  StructureType,
  Visibility,
} from "@/generated/prisma/enums";

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

describe("getSelectableCampaignYears", () => {
  it("propose les campagnes ouvertes et les campagnes passées qui ont des échanges, de la plus récente à la plus ancienne", () => {
    expect(
      getSelectableCampaignYears({
        openCampaignYears: [2027, 2028],
        tarificationYears: [2025, 2027],
      })
    ).toEqual([2028, 2027, 2025]);
  });
});

describe("assertCampaignOpen", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2026-12-31T21:00:00.000Z");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ferme une campagne passée à minuit heure locale de la structure", () => {
    expect(() =>
      assertCampaignOpen(2026, { departementAdministratif: "75" })
    ).not.toThrow();
    expect(() =>
      assertCampaignOpen(2026, { departementAdministratif: "974" })
    ).toThrow("lecture seule");
  });
});

describe("assertStructureEligible", () => {
  it("réserve la tarification aux CADA et aux CPH", () => {
    expect(() =>
      assertStructureEligible({ type: StructureType.CADA })
    ).not.toThrow();
    expect(() => assertStructureEligible({ type: StructureType.HUDA })).toThrow(
      "CADA et les CPH"
    );
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

  it("ne notifie personne tant que la messagerie est fermée", () => {
    vi.stubEnv("MESSAGERIE_ENABLED", "");

    expect(getRecipientIds([buildUser(2)])).toEqual([]);
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
