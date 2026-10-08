import { describe, expect, it } from "vitest";

import { GrantDb } from "@/app/api/users/user.db.type";
import { getEffectiveGrants, toSessionGrant } from "@/app/api/users/user.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

const buildGrant = (overrides: Partial<GrantDb> = {}): GrantDb => ({
  role: AccessRole.EDITEUR,
  scope: GrantScope.NATIONAL,
  region: null,
  departement: null,
  structure: null,
  ...overrides,
});

describe("toSessionGrant", () => {
  it("marque un binôme national sans département ni structure", () => {
    expect(toSessionGrant(buildGrant({ role: AccessRole.ADMIN }))).toEqual({
      role: AccessRole.ADMIN,
      isNational: true,
      departementNumeros: [],
      structureIds: [],
    });
  });

  it("résout un binôme régional en départements de la région", () => {
    const grant = buildGrant({
      scope: GrantScope.REGION,
      region: {
        name: "Bretagne",
        departements: [{ numero: "29" }, { numero: "35" }],
      },
    });

    expect(toSessionGrant(grant)).toMatchObject({
      isNational: false,
      departementNumeros: ["29", "35"],
      structureIds: [],
    });
  });

  it("résout un binôme départemental en un seul département", () => {
    const grant = buildGrant({
      scope: GrantScope.DEPARTEMENT,
      departement: { numero: "75", name: "Paris" },
    });

    expect(toSessionGrant(grant).departementNumeros).toEqual(["75"]);
  });

  it("résout un binôme structure en une seule structure", () => {
    const grant = buildGrant({
      scope: GrantScope.STRUCTURE,
      structure: { id: 3, codeBhasile: "BHA-OCC-001" },
    });

    expect(toSessionGrant(grant)).toMatchObject({
      isNational: false,
      departementNumeros: [],
      structureIds: [3],
    });
  });

  it("n'accorde rien à un binôme dont la cible est manquante", () => {
    expect(
      toSessionGrant(buildGrant({ scope: GrantScope.DEPARTEMENT }))
    ).toMatchObject({
      isNational: false,
      departementNumeros: [],
      structureIds: [],
    });
  });
});

describe("getEffectiveGrants", () => {
  const patternGrant = buildGrant({ role: AccessRole.LECTEUR });
  const userGrant = buildGrant();

  it("fait primer les binômes de l'utilisateur sur ceux de son pattern d'email", () => {
    expect(
      getEffectiveGrants({
        grants: [userGrant],
        emailPattern: { grants: [patternGrant] },
      })
    ).toEqual([userGrant]);
  });

  it("retombe sur les droits de base du pattern quand l'utilisateur n'a aucun binôme", () => {
    expect(
      getEffectiveGrants({
        grants: [],
        emailPattern: { grants: [patternGrant] },
      })
    ).toEqual([patternGrant]);
  });

  it("ne renvoie rien sans binôme ni pattern", () => {
    expect(getEffectiveGrants({ grants: [], emailPattern: null })).toEqual([]);
  });
});
