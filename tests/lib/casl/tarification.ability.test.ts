import {
  createDepartementalAgent,
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("refuse la tarification à un agent d'un autre département", () => {
    expect(
      canAccessTarification(createDepartementalAgent(["50"]), parisStructure)
    ).toBe(false);
  });

  it("refuse la tarification à un agent national, même éditeur", () => {
    expect(canAccessTarification(createNationalAgent(), parisStructure)).toBe(
      false
    );
  });

  describe("avant la mise en service", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("refuse la tarification aux agents tant que la messagerie n'est pas activée", () => {
      vi.stubEnv("MESSAGERIE_ENABLED", "");

      expect(
        canAccessTarification(createDepartementalAgent(["75"]), parisStructure)
      ).toBe(false);
    });

    it("ouvre la tarification aux superadmins", () => {
      vi.stubEnv("MESSAGERIE_ENABLED", "");

      expect(
        canAccessTarification(
          createSessionUser({ isSuperAdmin: true }),
          parisStructure
        )
      ).toBe(true);
    });
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
