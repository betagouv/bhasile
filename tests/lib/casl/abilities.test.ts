import { describe, expect, it } from "vitest";

// eslint-disable-next-line no-restricted-imports
import { Structure } from "@/generated/prisma/client";
import { canUpdateDepartement, canUpdateStructure } from "@/lib/casl/abilities";
import { SessionUser } from "@/types/global";

describe("Permissions : canUpdateStructure", () => {
  const structure1 = {
    id: 1,
    departementAdministratif: "1",
  } as Structure;

  const structure13 = {
    id: 2,
    departementAdministratif: "13",
  } as Structure;

  const structure69 = {
    id: 3,
    departementAdministratif: "69",
  } as Structure;

  it("autorise un agent NATIONAL à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user1",
      role: "NATIONAL",
      allowedDepartements: [...Array(96).keys()].map((num) => num.toString()),
    } as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(true);
  });

  it("autorise un agent DEPARTEMENT à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user2",
      role: "DEPARTEMENT_AIN",
      allowedDepartements: ["1"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure1)).toBe(true);
  });

  it("refuse à un agent DEPARTEMENT de modifier une structure si son département n'est pas dans allowedDepartements", () => {
    const user = {
      id: "user3",
      role: "DEPARTEMENT_RHONE",
      allowedDepartements: ["69"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(false);
  });

  it("autorise un agent REGION à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user4",
      role: "REGION_PAC",
      allowedDepartements: ["04", "05", "06", "13", "83", "84"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("refuse à un agent ANONYMOUS de modifier une structure", () => {
    const user = {
      id: "user5",
      role: "ANONYMOUS",
      allowedDepartements: [],
    } as unknown as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("refuse à un utilisateur déconnecté de modifier une structure", () => {
    expect(
      canUpdateStructure(undefined as unknown as SessionUser, structure69)
    ).toBe(false);
  });
});

describe("Permissions : canUpdateDepartement", () => {
  const nationalUser = {
    id: "national",
    role: "NATIONAL",
    allowedDepartements: [] as string[],
  } as SessionUser;

  const departementUser = {
    id: "departement",
    role: "DEPARTEMENT_MANCHE",
    allowedDepartements: ["50"],
  } as SessionUser;

  it("autorise un agent NATIONAL sur n'importe quel département, y compris un département undefined", () => {
    expect(canUpdateDepartement(nationalUser, "50")).toBe(true);
    expect(canUpdateDepartement(nationalUser, "13")).toBe(true);
    expect(canUpdateDepartement(nationalUser, undefined)).toBe(true);
  });

  it("autorise un agent DEPARTEMENT uniquement sur son propre département", () => {
    expect(canUpdateDepartement(departementUser, "50")).toBe(true);
    expect(canUpdateDepartement(departementUser, "13")).toBe(false);
  });

  it("masque les transformations sans département à un agent DEPARTEMENT", () => {
    expect(canUpdateDepartement(departementUser, undefined)).toBe(false);
    expect(canUpdateDepartement(departementUser, null)).toBe(false);
  });
});
