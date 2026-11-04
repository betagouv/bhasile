import {
  createDepartementalAgent,
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it } from "vitest";

import { Visibility } from "@/generated/prisma/enums";
import { canAccessTarification, canReadConversation } from "@/lib/casl";

describe("canAccessTarification", () => {
  const parisStructure = {
    id: 1,
    departementAdministratif: "75",
    operateurId: null,
  };

  it("ouvre la tarification à un agent éditeur du département", () => {
    expect(
      canAccessTarification(createDepartementalAgent(["75"]), parisStructure)
    ).toBe(true);
  });

  it("la ferme à un agent d'un autre département", () => {
    expect(
      canAccessTarification(createDepartementalAgent(["50"]), parisStructure)
    ).toBe(false);
  });

  it("la ferme à un agent national, même éditeur", () => {
    expect(canAccessTarification(createNationalAgent(), parisStructure)).toBe(
      false
    );
  });
});

describe("canReadConversation", () => {
  const structure = { id: 1, departementAdministratif: "75", operateurId: 7 };
  const operateurUser = createSessionUser({
    operateurId: 7,
    grants: [createSessionGrant({ structureIds: [1] })],
  });

  it("refuse la conversation agents à un utilisateur de l'opérateur", () => {
    expect(
      canReadConversation(operateurUser, {
        visibility: Visibility.AGENTS,
        structureTarification: { structure },
      })
    ).toBe(false);
  });

  it("ouvre la conversation agents à un agent du département", () => {
    expect(
      canReadConversation(createDepartementalAgent(["75"]), {
        visibility: Visibility.AGENTS,
        structureTarification: { structure },
      })
    ).toBe(true);
  });
});
