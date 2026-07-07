import { cn } from "@/app/utils/classname.util";

describe("classname util", () => {
  describe("cn", () => {
    it("concatène en une seule chaîne quand on passe deux chaînes", () => {
      // GIVEN
      const class1 = "text-red-500";
      const class2 = "bg-blue-200";

      // WHEN
      const result = cn(class1, class2);

      // THEN
      expect(result).toBe("text-red-500 bg-blue-200");
    });

    it("intègre les classes de façon conditionnelle selon le contexte", () => {
      // GIVEN
      const isPrimary = true;

      // WHEN
      const result = cn(
        "btn",
        isPrimary && "btn-primary",
        !isPrimary && "btn-secondary"
      );

      // THEN
      expect(result).toBe("btn btn-primary");
    });

    it("retourne une chaîne concaténée quand on passe des classes, des tableaux et des objets", () => {
      // GIVEN
      const hasShadow = true;

      // WHEN
      const result = cn("card", ["p-4", "rounded"], { "shadow-lg": hasShadow });

      // THEN
      expect(result).toBe("card p-4 rounded shadow-lg");
    });

    it("retourne la dernière classe en cas de conflit", () => {
      // GIVEN
      const class1 = "px-4 text-sm";
      const class2 = "px-6 text-lg";

      // WHEN
      const result = cn(class1, class2);

      // THEN
      expect(result).toBe("px-6 text-lg");
    });
  });
});
