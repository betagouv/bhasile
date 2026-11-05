import {
  createDepartementPerimeter,
  createNationalPerimeter,
  createUserWithGrants,
} from "tests/test-utils/factories/user-with-grants.factory";
import { describe, expect, it } from "vitest";

import { GrantDb } from "@/app/api/users/user.db.type";
import {
  getAccountStatus,
  getAssignedGrants,
  isAgentUser,
  normalizeEmail,
  toContactGrant,
  toSessionGrant,
} from "@/app/api/users/user.util";
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
      regionIds: [],
      structureIds: [],
    });
  });

  it("résout un binôme régional en départements de la région", () => {
    const grant = buildGrant({
      scope: GrantScope.REGION,
      region: {
        id: 3,
        name: "Bretagne",
        departements: [{ numero: "29" }, { numero: "35" }],
      },
    });

    expect(toSessionGrant(grant)).toMatchObject({
      isNational: false,
      departementNumeros: ["29", "35"],
      regionIds: [3],
      structureIds: [],
    });
  });

  it("résout un binôme départemental en un seul département", () => {
    const grant = buildGrant({
      scope: GrantScope.DEPARTEMENT,
      departement: { numero: "75", name: "Paris", regionId: 8 },
    });

    expect(toSessionGrant(grant)).toMatchObject({
      departementNumeros: ["75"],
      regionIds: [8],
    });
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

describe("normalizeEmail", () => {
  it("retire les espaces et passe l'adresse en minuscules", () => {
    expect(normalizeEmail("  Jean.Dupont@Interieur.GOUV.fr ")).toBe(
      "jean.dupont@interieur.gouv.fr"
    );
  });
});

describe("getAccountStatus", () => {
  it("distingue un compte activé, en attente et désactivé", () => {
    expect(getAccountStatus({ isActivated: true, deactivatedAt: null })).toBe(
      "ACTIVATED"
    );
    expect(getAccountStatus({ isActivated: false, deactivatedAt: null })).toBe(
      "PENDING"
    );
    expect(
      getAccountStatus({ isActivated: false, deactivatedAt: new Date() })
    ).toBe("DEACTIVATED");
  });
});

describe("isAgentUser", () => {
  it("considère comme agent un user rattaché à un périmètre", () => {
    expect(isAgentUser(createUserWithGrants())).toBe(true);
  });

  it("ne considère pas comme agent un user sans périmètre", () => {
    expect(isAgentUser(createUserWithGrants({ perimeter: null }))).toBe(false);
  });

  it("ne considère jamais comme agent un user rattaché à un opérateur", () => {
    expect(isAgentUser(createUserWithGrants({ operateurId: 3 }))).toBe(false);
  });

  it("considère un superadmin comme agent", () => {
    expect(
      isAgentUser(createUserWithGrants({ isSuperAdmin: true, perimeter: null }))
    ).toBe(true);
  });
});

describe("getAssignedGrants", () => {
  const grant = buildGrant({ role: AccessRole.LECTEUR });

  it("donne à un agent la lecture nationale et l'admin sur son périmètre", () => {
    const perimeter = createDepartementPerimeter("29", "Finistère");

    expect(getAssignedGrants(createUserWithGrants({ perimeter }))).toEqual([
      buildGrant({ role: AccessRole.LECTEUR }),
      buildGrant({
        role: AccessRole.ADMIN,
        scope: GrantScope.DEPARTEMENT,
        departement: perimeter.departement,
      }),
    ]);
  });

  it("ne donne que la lecture nationale à un agent d'un périmètre national", () => {
    expect(
      getAssignedGrants(
        createUserWithGrants({ perimeter: createNationalPerimeter() })
      ).map(({ role, scope }) => [role, scope])
    ).toEqual([[AccessRole.LECTEUR, GrantScope.NATIONAL]]);
  });

  it("ignore les binômes personnels d'un agent", () => {
    const structureGrant = buildGrant({
      scope: GrantScope.STRUCTURE,
      structure: { id: 12, codeBhasile: "C12" },
    });

    expect(
      getAssignedGrants(createUserWithGrants({ grants: [structureGrant] }))
    ).not.toContainEqual(structureGrant);
  });

  it("applique les binômes d'un user rattaché à un opérateur", () => {
    expect(
      getAssignedGrants(
        createUserWithGrants({
          operateurId: 3,
          perimeter: null,
          grants: [grant],
        })
      )
    ).toEqual([grant]);
  });

  it("ne donne rien à un user ni agent ni opérateur", () => {
    expect(
      getAssignedGrants(
        createUserWithGrants({ perimeter: null, grants: [grant] })
      )
    ).toEqual([]);
  });

  it("ne donne rien à un compte non activé", () => {
    expect(
      getAssignedGrants(createUserWithGrants({ isActivated: false }))
    ).toEqual([]);
    expect(
      getAssignedGrants(
        createUserWithGrants({
          isActivated: false,
          operateurId: 3,
          grants: [grant],
        })
      )
    ).toEqual([]);
  });
});

describe("toContactGrant", () => {
  it("donne la lecture seule sur la structure", () => {
    expect(toContactGrant(12)).toEqual({
      role: AccessRole.LECTEUR,
      isNational: false,
      departementNumeros: [],
      regionIds: [],
      structureIds: [12],
    });
  });
});
