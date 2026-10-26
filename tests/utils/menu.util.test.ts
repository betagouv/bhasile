import { describe, expect, it } from "vitest";

import { resolveMenuItems } from "@/app/utils/menu.util";
import { SessionUser } from "@/types/global";

describe("menu.util", () => {
  describe("resolveMenuItems", () => {
    it("doit retourner les menus agents pour un utilisateur standard", () => {
      // GIVEN
      const agentUser: Partial<SessionUser> = {
        email: "agent@example.com",
        name: "Jean Agent",
      };

      // WHEN
      const menuItems = resolveMenuItems(agentUser as SessionUser);

      // THEN
      expect(menuItems).toHaveLength(4);
      expect(menuItems[0].label).toBe("Tableau de bord");
    });

    it("doit retourner le menu opérateur avec le bon identifiant pour un utilisateur opérateur", () => {
      // GIVEN
      const operateurUser: Partial<SessionUser> = {
        email: "operateur@example.com",
        name: "Marie Opérateur",
        operateurId: 42,
      };

      // WHEN
      const menuItems = resolveMenuItems(operateurUser as SessionUser);

      // THEN
      expect(menuItems).toHaveLength(1);
      expect(menuItems[0].label).toBe("Opérateur");
      expect(menuItems[0].url).toBe("/operateurs/42");
    });
  });
});
