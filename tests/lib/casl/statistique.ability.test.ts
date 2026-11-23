import {
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it } from "vitest";

import { canReadStatistiques } from "@/lib/casl";
import { hasNationalRead } from "@/lib/casl/rules";

const operateurUser = createSessionUser({
  operateurId: 42,
  isAgent: false,
  grants: [createSessionGrant({ departementNumeros: ["29"] })],
});

const contactUser = createSessionUser({
  operateurId: null,
  isAgent: false,
  grants: [createSessionGrant({ structureIds: [12] })],
});

describe("canReadStatistiques", () => {
  it("autorise un agent", () => {
    expect(canReadStatistiques(createNationalAgent(), "all")).toBe(true);
  });

  it("autorise un opérateur qui lit au moins deux structures", () => {
    expect(canReadStatistiques(operateurUser, [1, 2])).toBe(true);
  });

  it("refuse un opérateur qui ne lit qu'une structure", () => {
    expect(canReadStatistiques(operateurUser, [1])).toBe(false);
  });

  it("refuse un opérateur qui ne lit aucune structure", () => {
    expect(canReadStatistiques(operateurUser, [])).toBe(false);
  });

  it("refuse un contact sans opérateur, même avec plusieurs structures", () => {
    expect(canReadStatistiques(contactUser, [1, 2])).toBe(false);
  });

  it("refuse un utilisateur non connecté", () => {
    expect(canReadStatistiques(undefined, "all")).toBe(false);
  });
});

describe("hasNationalRead", () => {
  it("vaut pour un agent et un superadmin", () => {
    expect(hasNationalRead(createNationalAgent())).toBe(true);
    expect(
      hasNationalRead(createSessionUser({ isAgent: false, isSuperAdmin: true }))
    ).toBe(true);
  });

  it("ne vaut ni pour un opérateur ni pour un contact", () => {
    expect(hasNationalRead(operateurUser)).toBe(false);
    expect(hasNationalRead(contactUser)).toBe(false);
  });
});
