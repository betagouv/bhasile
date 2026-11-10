import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionUser } from "@/types/global";
import { MenuGroup, MenuItem, resolveMenuItems } from "@/utils/menu.util";

describe("menu.util", () => {
  describe("resolveMenuItems", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_SHOW_RESSOURCES", "false");
      vi.stubEnv("NEXT_PUBLIC_SHOW_PARAMETRES", "false");
    });

    it("doit retourner les menus agents pour un utilisateur agent", () => {
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

    it("doit retourner le menu opérateur avec le bon identifiant pour un utilisateur opérateur", () => {
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

      expect(urls).toEqual(["/structures", "/operateurs/42"]);
    });

    it("n'affiche à un non-agent sans opérateur que les structures", () => {
      const contactUser: Partial<SessionUser> = {
        operateurId: null,
        isAgent: false,
      };

      const urls = listUrls(resolveMenuItems(contactUser as SessionUser));

      expect(urls).toEqual(["/structures"]);
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

const listUrls = (menuItems: MenuItem[]): string[] =>
  menuItems.flatMap((item) =>
    "subItems" in item
      ? item.subItems.map((subItem) => subItem.url)
      : [item.url]
  );
