import { describe, expect, it } from "vitest";

import { GrantDb } from "@/app/api/users/user.db.type";
import {
  getAssignedGrants,
  getEffectiveGrants,
  isAgentUser,
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

describe("isAgentUser", () => {
  const buildUser = (
    overrides: Partial<Parameters<typeof isAgentUser>[0]> = {}
  ) => ({
    isSuperAdmin: false,
    isAgent: null,
    operateurId: null,
    emailPattern: null,
    ...overrides,
  });

  it("reprend le statut du pattern d'email quand celui du user n'est pas renseigné", () => {
    expect(isAgentUser(buildUser({ emailPattern: { isAgent: true } }))).toBe(
      true
    );
    expect(isAgentUser(buildUser({ emailPattern: { isAgent: false } }))).toBe(
      false
    );
  });

  it("fait primer le statut du user sur celui de son pattern", () => {
    expect(
      isAgentUser(
        buildUser({ isAgent: false, emailPattern: { isAgent: true } })
      )
    ).toBe(false);
    expect(isAgentUser(buildUser({ isAgent: true }))).toBe(true);
  });

  it("ne considère pas comme agent un user sans statut ni pattern", () => {
    expect(isAgentUser(buildUser())).toBe(false);
  });

  it("ne considère jamais comme agent un user rattaché à un opérateur", () => {
    expect(isAgentUser(buildUser({ isAgent: true, operateurId: 3 }))).toBe(
      false
    );
  });

  it("considère un superadmin comme agent", () => {
    expect(isAgentUser(buildUser({ isSuperAdmin: true }))).toBe(true);
  });
});

describe("getAssignedGrants", () => {
  const grant = buildGrant({ role: AccessRole.LECTEUR });

  it("applique les binômes d'un agent", () => {
    expect(
      getAssignedGrants({
        isSuperAdmin: false,
        isAgent: true,
        operateurId: null,
        grants: [grant],
        emailPattern: null,
      })
    ).toEqual([grant]);
  });

  it("applique les binômes d'un user rattaché à un opérateur", () => {
    expect(
      getAssignedGrants({
        isSuperAdmin: false,
        isAgent: false,
        operateurId: 3,
        grants: [grant],
        emailPattern: null,
      })
    ).toEqual([grant]);
  });

  it("ignore les binômes d'un user ni agent ni rattaché à un opérateur", () => {
    expect(
      getAssignedGrants({
        isSuperAdmin: false,
        isAgent: null,
        operateurId: null,
        grants: [grant],
        emailPattern: { isAgent: false, grants: [grant] },
      })
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
