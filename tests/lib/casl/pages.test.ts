import {
  createDepartementalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it } from "vitest";

import { AccessRole } from "@/generated/prisma/client";
import { canAccessPage } from "@/lib/casl/pages";

describe("canAccessPage", () => {
  it("refuse l'accès si l'utilisateur n'est pas connecté", () => {
    expect(canAccessPage(undefined, "/")).toBe(false);
  });

  describe("pour un utilisateur opérateur", () => {
    const currentOperateurUser = createSessionUser({
      operateurId: 42,
      isAgent: false,
    });

    it("autorise l'accès aux structures", () => {
      expect(canAccessPage(currentOperateurUser, "/structures")).toBe(true);
      expect(canAccessPage(currentOperateurUser, "/structures/12")).toBe(true);
    });

    it("autorise la lecture des CPOM et des statistiques", () => {
      expect(canAccessPage(currentOperateurUser, "/cpoms")).toBe(true);
      expect(canAccessPage(currentOperateurUser, "/cpoms/12")).toBe(true);
      expect(canAccessPage(currentOperateurUser, "/statistiques")).toBe(true);
      expect(
        canAccessPage(currentOperateurUser, "/statistiques/cartographie")
      ).toBe(true);
    });

    it("refuse la création et la modification des CPOM", () => {
      expect(
        canAccessPage(currentOperateurUser, "/cpoms/ajout/01-identification")
      ).toBe(false);
      expect(
        canAccessPage(currentOperateurUser, "/cpoms/12/ajout/02-finances")
      ).toBe(false);
      expect(
        canAccessPage(currentOperateurUser, "/cpoms/12/modification/finances")
      ).toBe(false);
    });

    it("refuse l'accès aux pages réservées aux agents", () => {
      expect(canAccessPage(currentOperateurUser, "/")).toBe(false);
      expect(canAccessPage(currentOperateurUser, "/ressources")).toBe(false);
      expect(
        canAccessPage(currentOperateurUser, "/structures/transformation/type")
      ).toBe(false);
    });

    it("refuse l'accès à la liste des opérateurs et aux modifications de sa fiche", () => {
      expect(canAccessPage(currentOperateurUser, "/operateurs")).toBe(false);
      expect(
        canAccessPage(
          currentOperateurUser,
          "/operateurs/42/modification/description"
        )
      ).toBe(false);
    });

    it("autorise l'accès à sa propre page opérateur de base", () => {
      expect(canAccessPage(currentOperateurUser, "/operateurs/42")).toBe(true);
    });

    it("refuse l'accès à la page opérateur de base d'un autre opérateur", () => {
      expect(canAccessPage(currentOperateurUser, "/operateurs/99")).toBe(false);
    });

    it("refuse l'accès à la racine de la base opérateur si l'utilisateur n'a pas d'id opérateur", () => {
      const operateurWithoutId = createSessionUser({
        operateurId: null,
        isAgent: false,
      });
      expect(canAccessPage(operateurWithoutId, "/operateurs/42")).toBe(false);
    });
  });

  describe("pour un contact sans opérateur rattaché", () => {
    const contactUser = createSessionUser({
      operateurId: null,
      isAgent: false,
      grants: [createSessionGrant({ structureIds: [12] })],
    });

    it("autorise l'accès aux structures", () => {
      expect(canAccessPage(contactUser, "/structures/12")).toBe(true);
    });

    it("refuse l'accès aux CPOM et aux statistiques", () => {
      expect(canAccessPage(contactUser, "/cpoms")).toBe(false);
      expect(canAccessPage(contactUser, "/cpoms/12")).toBe(false);
      expect(canAccessPage(contactUser, "/statistiques")).toBe(false);
    });
  });

  describe("pour un utilisateur agent", () => {
    const currentAgentUser = createDepartementalAgent(["75"]);

    it("autorise l'accès aux pages communes", () => {
      expect(canAccessPage(currentAgentUser, "/")).toBe(true);
      expect(canAccessPage(currentAgentUser, "/structures")).toBe(true);
      expect(canAccessPage(currentAgentUser, "/cpoms")).toBe(true);
      expect(canAccessPage(currentAgentUser, "/statistiques")).toBe(true);
    });

    it("autorise l'accès aux pages réservées aux agents", () => {
      expect(canAccessPage(currentAgentUser, "/ressources")).toBe(true);
      expect(canAccessPage(currentAgentUser, "/operateurs")).toBe(true);
      expect(
        canAccessPage(currentAgentUser, "/structures/transformation/type")
      ).toBe(true);
    });

    it("autorise la création et la modification des CPOM à un agent éditeur", () => {
      expect(
        canAccessPage(currentAgentUser, "/cpoms/ajout/01-identification")
      ).toBe(true);
      expect(
        canAccessPage(currentAgentUser, "/cpoms/12/modification/finances")
      ).toBe(true);
    });

    it("refuse la création et la modification des CPOM à un agent sans droit d'écriture", () => {
      const readOnlyAgent = createSessionUser({
        grants: [
          createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
        ],
      });
      expect(canAccessPage(readOnlyAgent, "/cpoms/12")).toBe(true);
      expect(
        canAccessPage(readOnlyAgent, "/cpoms/ajout/01-identification")
      ).toBe(false);
      expect(
        canAccessPage(readOnlyAgent, "/cpoms/12/modification/finances")
      ).toBe(false);
    });

    it("refuse les transformations à un agent sans droit d'écriture", () => {
      const readOnlyAgent = createSessionUser({
        grants: [
          createSessionGrant({ role: AccessRole.LECTEUR, isNational: true }),
        ],
      });
      expect(
        canAccessPage(readOnlyAgent, "/structures/transformation/type")
      ).toBe(false);
    });
  });

  describe("pour le cockpit admin", () => {
    it("ouvre le cockpit et ses pages à un super admin", () => {
      const superAdmin = createSessionUser({ isSuperAdmin: true });

      expect(canAccessPage(superAdmin, "/parametres/cockpit-admin")).toBe(true);
      expect(
        canAccessPage(superAdmin, "/parametres/cockpit-admin/import-ofii")
      ).toBe(true);
    });

    it("ferme le cockpit à un agent admin de son département", () => {
      expect(
        canAccessPage(
          createDepartementalAgent(["75"]),
          "/parametres/cockpit-admin"
        )
      ).toBe(false);
    });
  });
});
