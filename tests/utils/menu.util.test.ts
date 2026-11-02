import { describe, expect, it } from "vitest";

import { SessionUser } from "@/types/global";
import { MenuGroup, resolveMenuItems } from "@/utils/menu.util";

describe("menu.util", () => {
  describe("resolveMenuItems", () => {
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
      expect(menuItems.length).toBe(3);
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
      const structuresMenuGroup = menuItems[1] as MenuGroup;
      expect(structuresMenuGroup).toBeDefined();

      const operateurSubItem = structuresMenuGroup.subItems.find(
        (subItem) => subItem.label === "Voir l’opérateur"
      );

      expect(operateurSubItem).toBeDefined();
      expect(operateurSubItem?.url).toBe("/operateurs/42");
    });
  });
});
