import { describe, expect, it } from "vitest";

// eslint-disable-next-line no-restricted-imports
import { Structure } from "@/generated/prisma/client";
import { canUpdateStructure } from "@/lib/casl/abilities";
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

  it("should allow a user with role NATIONAL to update structure if department in allowedDepartments", () => {
    const user = {
      id: "user1",
      role: "NATIONAL",
      allowedDepartements: [...Array(96).keys()].map((num) => num.toString()),
    } as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(true);
  });

  it("should allow a user with role DEPARTEMENT to update structure if department in allowedDepartments", () => {
    const user = {
      id: "user2",
      role: "DEPARTEMENT_AIN",
      allowedDepartements: ["1"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure1)).toBe(true);
  });

  it("should not allow a user with role DEPARTEMENT to update structure if department is not in allowedDepartments", () => {
    const user = {
      id: "user3",
      role: "DEPARTEMENT_RHONE",
      allowedDepartements: ["69"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(false);
  });

  it("should allow a user with role REGION to update structure if department in allowedDepartments", () => {
    const user = {
      id: "user4",
      role: "REGION_PAC",
      allowedDepartements: ["04", "05", "06", "13", "83", "84"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("should not allow a user with role ANONYMOUS to update structure", () => {
    const user = {
      id: "user5",
      role: "ANONYMOUS",
      allowedDepartements: [],
    } as unknown as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("should not allow a disconnected user to update structure", () => {
    expect(
      canUpdateStructure(undefined as unknown as SessionUser, structure69)
    ).toBe(false);
  });
});
