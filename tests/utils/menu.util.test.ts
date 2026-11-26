import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionUser } from "@/types/global";
import { MenuGroup, MenuItem, resolveMenuItems } from "@/utils/menu.util";

describe("menu.util", () => {
  describe("resolveMenuItems", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SHOW_RESSOURCES", "false");
      vi.stubEnv("NEXT_PUBLIC_SHOW_PARAMETRES", "false");
    });

    it("renvoie le menu agent pour un utilisateur agent", () => {
      // GIVEN
      const agentUser: Partial<SessionUser> = {
        email: "agent@example.com",
        name: "Jean Agent",
        isAgent: true,
      };

      // WHEN
      const menuItems = resolveMenuItems(agentUser as SessionUser);

      // THEN
      expect(menuItems.length).toBeGreaterThanOrEqual(3);
      expect(menuItems[0].label).toBe("Tableau de bord");
    });

    it("renvoie le menu opérateur avec le lien vers son opérateur", () => {
      // GIVEN
      const operateurUser: Partial<SessionUser> = {
        email: "operateur@example.com",
        name: "Marie Opérateur",
        operateurId: 42,
        isAgent: false,
      };

      // WHEN
      const menuItems = resolveMenuItems(operateurUser as SessionUser);

      // THEN
      const structuresMenuGroup = menuItems.find(
        (item) => "id" in item && item.id === "structures"
      ) as MenuGroup;

      expect(structuresMenuGroup).toBeDefined();

      const operateurSubItem = structuresMenuGroup.subItems.find(
        (subItem) => subItem.label === "Voir l’opérateur"
      );

      expect(operateurSubItem).toBeDefined();
      expect(operateurSubItem?.url).toBe("/operateurs/42");
    });

    it("n'affiche à un opérateur que les pages qui lui sont ouvertes", () => {
      const operateurUser: Partial<SessionUser> = {
        operateurId: 42,
        isAgent: false,
      };

      const urls = listUrls(resolveMenuItems(operateurUser as SessionUser));

      expect(urls).toEqual([
        "/structures",
        "/cpoms",
        "/operateurs/42",
        "/statistiques",
      ]);
    });

    it("n'affiche à un non-agent sans opérateur que les structures", () => {
      const contactUser: Partial<SessionUser> = {
        operateurId: null,
        isAgent: false,
      };

      const urls = listUrls(resolveMenuItems(contactUser as SessionUser));

      expect(urls).toEqual(["/structures"]);
    });

    describe("selon les entités lisibles", () => {
      const operateurUser: Partial<SessionUser> = {
        operateurId: 42,
        isAgent: false,
      };

      it("mène directement à la fiche quand une seule structure est lisible", () => {
        const menuItems = resolveMenuItems(operateurUser as SessionUser, {
          structureIds: [7],
          cpomIds: [3, 4],
        });

        expect(findStructuresSubItems(menuItems)).toContainEqual({
          label: "Voir la structure",
          url: "/structures/7",
        });
      });

      it("mène à la liste quand plusieurs structures sont lisibles", () => {
        const menuItems = resolveMenuItems(operateurUser as SessionUser, {
          structureIds: [7, 8],
          cpomIds: [3, 4],
        });

        expect(findStructuresSubItems(menuItems)).toContainEqual({
          label: "Voir les structures",
          url: "/structures",
        });
      });

      it("mène directement au CPOM quand un seul est lisible", () => {
        const menuItems = resolveMenuItems(operateurUser as SessionUser, {
          structureIds: [7, 8],
          cpomIds: [3],
        });

        expect(findStructuresSubItems(menuItems)).toContainEqual({
          label: "Voir le CPOM",
          url: "/cpoms/3",
        });
      });

      it("masque les CPOM quand aucun n'est lisible", () => {
        const urls = listUrls(
          resolveMenuItems(operateurUser as SessionUser, {
            structureIds: [7, 8],
            cpomIds: [],
          })
        );

        expect(urls).toEqual([
          "/structures",
          "/operateurs/42",
          "/statistiques",
        ]);
      });

      it("garde les statistiques quand une seule structure est lisible", () => {
        const urls = listUrls(
          resolveMenuItems(operateurUser as SessionUser, {
            structureIds: [7],
            cpomIds: [3],
          })
        );

        expect(urls).toEqual([
          "/structures/7",
          "/cpoms/3",
          "/operateurs/42",
          "/statistiques",
        ]);
      });

      it("mène aux listes quand les entités lisibles sont inconnues", () => {
        const urls = listUrls(resolveMenuItems(operateurUser as SessionUser));

        expect(urls).toEqual([
          "/structures",
          "/cpoms",
          "/operateurs/42",
          "/statistiques",
        ]);
      });
    });

    it("ajoute le cockpit admin dans Paramètres pour un super admin", () => {
      const superAdmin: Partial<SessionUser> = {
        isAgent: true,
        isSuperAdmin: true,
        grants: [],
      };

      expect(listUrls(resolveMenuItems(superAdmin as SessionUser))).toContain(
        "/parametres/cockpit-admin"
      );
    });

    it("affiche à un agent le tableau de bord, les CPOM, les opérateurs et les statistiques", () => {
      const agentUser: Partial<SessionUser> = { isAgent: true };

      const urls = listUrls(resolveMenuItems(agentUser as SessionUser));

      expect(urls).toEqual([
        "/",
        "/structures",
        "/cpoms",
        "/operateurs",
        "/statistiques",
      ]);
    });
  });
});

const findStructuresSubItems = (menuItems: MenuItem[]) =>
  (
    menuItems.find(
      (item) => "id" in item && item.id === "structures"
    ) as MenuGroup
  ).subItems;

const listUrls = (menuItems: MenuItem[]): string[] =>
  menuItems.flatMap((item) =>
    "subItems" in item
      ? item.subItems.map((subItem) => subItem.url)
      : [item.url]
  );
