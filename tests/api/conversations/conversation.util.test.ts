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
  it("classe un non-agent au niveau opérateur, le plus restreint", () => {
    expect(
      getAuthorLevel({
        isAgent: false,
        grants: [{ scope: GrantScope.STRUCTURE, role: AccessRole.EDITEUR }],
      })
    ).toBe(AuthorLevel.OPERATEUR);
  });

  it("retient le niveau régional quand un des grants d'édition est régional", () => {
    expect(
      getAuthorLevel({
        isAgent: true,
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
        isAgent: true,
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
        isAgent: true,
        grants: [{ scope: GrantScope.STRUCTURE, role: AccessRole.EDITEUR }],
      })
    ).toBe(AuthorLevel.DEPARTEMENT);
  });
});

describe("assertCanAccessVisibility", () => {
  it("refuse la conversation agents à un non-agent", () => {
    expect(() => assertCanAccessVisibility(false, Visibility.AGENTS)).toThrow(
      "réservés aux agents"
    );
  });

  it("ouvre la conversation partagée à un non-agent et les deux aux agents", () => {
    expect(() =>
      assertCanAccessVisibility(false, Visibility.SHARED)
    ).not.toThrow();
    expect(() =>
      assertCanAccessVisibility(true, Visibility.AGENTS)
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
