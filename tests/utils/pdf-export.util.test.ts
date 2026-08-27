import { describe, expect, it } from "vitest";

import { computeStartMonth, toYearMonth } from "@/app/utils/pdf-export.util";

describe("date util", () => {
  describe("toYearMonth", () => {
    it("formate correctement une date au format YYYY-MM", () => {
      expect(toYearMonth(new Date(2023, 0, 15))).toBe("2023-01");
      expect(toYearMonth(new Date(2023, 11, 31))).toBe("2023-12");
    });

    it("ajoute un zéro initial pour les mois à un seul chiffre", () => {
      expect(toYearMonth(new Date(2024, 4, 1))).toBe("2024-05");
      expect(toYearMonth(new Date(2024, 8, 9))).toBe("2024-09");
    });

    it("gère correctement le changement d'année", () => {
      expect(toYearMonth(new Date(1999, 11, 1))).toBe("1999-12");
      expect(toYearMonth(new Date(2000, 0, 1))).toBe("2000-01");
    });
  });

  describe("computeStartMonth", () => {
    it("calcule correctement le mois de début en soustrayant 5 mois", () => {
      expect(computeStartMonth("2024-06")).toBe("2024-01");
      expect(computeStartMonth("2024-12")).toBe("2024-07");
    });

    it("gère le chevauchement sur l'année précédente", () => {
      expect(computeStartMonth("2024-05")).toBe("2023-12");
      expect(computeStartMonth("2024-01")).toBe("2023-08");
      expect(computeStartMonth("2024-03")).toBe("2023-10");
    });

    it("retourne une chaîne vide si la valeur d'entrée est absente ou vide", () => {
      expect(computeStartMonth("")).toBe("");
      expect(computeStartMonth(null as unknown as string)).toBe("");
      expect(computeStartMonth(undefined as unknown as string)).toBe("");
    });
  });
});
