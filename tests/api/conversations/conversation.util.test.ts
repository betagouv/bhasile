import { describe, expect, it } from "vitest";

import {
  assertCanAccessVisibility,
  assertCanPostMessage,
  assertCanTag,
  assertTagKnown,
  getAuthorLevel,
} from "@/app/api/conversations/conversation.util";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";

describe("getAuthorLevel", () => {
  it("classe un utilisateur rattaché à un opérateur comme opérateur", () => {
    expect(
      getAuthorLevel({
        operateurId: 12,
        grants: [{ scope: GrantScope.STRUCTURE, role: AccessRole.EDITEUR }],
      })
    ).toBe(AuthorLevel.OPERATEUR);
  });

  it("retient le niveau régional quand un des grants d'édition est régional", () => {
    expect(
      getAuthorLevel({
        operateurId: null,
        grants: [
          { scope: GrantScope.DEPARTEMENT, role: AccessRole.EDITEUR },
          { scope: GrantScope.REGION, role: AccessRole.EDITEUR },
        ],
      })
    ).toBe(AuthorLevel.REGION);
  });

  it("ignore un grant régional en lecture seule", () => {
    expect(
      getAuthorLevel({
        operateurId: null,
        grants: [
          { scope: GrantScope.DEPARTEMENT, role: AccessRole.EDITEUR },
          { scope: GrantScope.REGION, role: AccessRole.LECTEUR },
        ],
      })
    ).toBe(AuthorLevel.DEPARTEMENT);
  });

  it("classe un agent départemental ou structure comme département", () => {
    expect(
      getAuthorLevel({
        operateurId: null,
        grants: [{ scope: GrantScope.STRUCTURE, role: AccessRole.EDITEUR }],
      })
    ).toBe(AuthorLevel.DEPARTEMENT);
  });
});

describe("assertCanAccessVisibility", () => {
  it("refuse la conversation agents à l'opérateur", () => {
    expect(() => assertCanAccessVisibility(true, Visibility.AGENTS)).toThrow(
      "pas accessibles à l'opérateur"
    );
  });

  it("ouvre la conversation partagée à l'opérateur et les deux aux agents", () => {
    expect(() =>
      assertCanAccessVisibility(true, Visibility.SHARED)
    ).not.toThrow();
    expect(() =>
      assertCanAccessVisibility(false, Visibility.AGENTS)
    ).not.toThrow();
  });
});

describe("assertCanPostMessage", () => {
  const tags = [{ key: "L48", label: "L48" }];

  it("accepte un message d'agent étiqueté avec une étiquette connue", () => {
    expect(() =>
      assertCanPostMessage(
        {
          level: AuthorLevel.DEPARTEMENT,
          visibility: Visibility.AGENTS,
          tagKey: "L48",
        },
        tags
      )
    ).not.toThrow();
  });

  it("refuse qu'un opérateur étiquette son message", () => {
    expect(() =>
      assertCanPostMessage(
        {
          level: AuthorLevel.OPERATEUR,
          visibility: Visibility.SHARED,
          tagKey: "L48",
        },
        tags
      )
    ).toThrow("Seuls les agents");
  });
});

describe("assertCanTag", () => {
  it("refuse qu'un opérateur étiquette un message", () => {
    expect(() => assertCanTag(AuthorLevel.OPERATEUR)).toThrow(
      "Seuls les agents"
    );
  });

  it("laisse un agent étiqueter un message", () => {
    expect(() => assertCanTag(AuthorLevel.REGION)).not.toThrow();
  });
});

describe("assertTagKnown", () => {
  const tags = [{ key: "L48", label: "L48" }];

  it("accepte une étiquette fournie par le contexte", () => {
    expect(() => assertTagKnown("L48", tags)).not.toThrow();
  });

  it("rejette une étiquette inconnue du contexte", () => {
    expect(() => assertTagKnown("DAB", tags)).toThrow("Étiquette inconnue");
  });
});
