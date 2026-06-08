import { describe, expect, it } from "vitest";

import {
  formatCityName,
  getDepartementFromCodePostal,
  isAdresseEmpty,
} from "@/app/utils/adresse.util";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

const makeEmptyAdresse = (
  overrides: Partial<FormAdresse> = {}
): FormAdresse => ({
  adresseComplete: "",
  adresse: "",
  codePostal: "",
  commune: "",
  departement: "",
  repartition: Repartition.DIFFUS,
  ...overrides,
});

describe("adresse util", () => {
  describe("getDepartementFromCodePostal", () => {
    it("returns first two digits for mainland postal codes", () => {
      expect(getDepartementFromCodePostal("75011")).toBe("75");
    });

    it("returns first three digits for overseas postal codes", () => {
      expect(getDepartementFromCodePostal("97100")).toBe("971");
      expect(getDepartementFromCodePostal("98630")).toBe("986");
    });

    it("trims spaces before extracting department code", () => {
      expect(getDepartementFromCodePostal("  13008  ")).toBe("13");
    });
  });

  describe("formatCityName", () => {
    it("formats names correctly with hyphens", () => {
      expect(formatCityName("Gamaches en Vexin")).toBe("Gamaches-en-Vexin");
      expect(formatCityName("Ivry la Bataille")).toBe("Ivry-la-Bataille");
      expect(formatCityName("Neuilly sur Seine")).toBe("Neuilly-sur-Seine");
    });

    it("handles articles at the beginning without hyphen", () => {
      expect(formatCityName("Les Andelys")).toBe("Les Andelys");
      expect(formatCityName("Le Grau du Roi")).toBe("Le Grau-du-Roi");
      expect(formatCityName("La Rochelle")).toBe("La Rochelle");
    });

    it("handles names with multiple words", () => {
      expect(formatCityName("Rueil-malmaison")).toBe("Rueil-Malmaison");
    });

    it("lowercases prepositions and inside articles", () => {
      expect(formatCityName("Neuilly Sur Seine")).toBe("Neuilly-sur-Seine");
      expect(formatCityName("Le Grau du Roi")).toBe("Le Grau-du-Roi");
      expect(formatCityName("Ville sous Bois")).toBe("Ville-sous-Bois");
      expect(formatCityName("Ivry La Bataille")).toBe("Ivry-la-Bataille");
      expect(formatCityName("Aulnay-Sous-Bois")).toBe("Aulnay-sous-Bois");
    });

    it("capitalizes all other words correctly", () => {
      expect(formatCityName("PARIS")).toBe("Paris");
      expect(formatCityName("lyon")).toBe("Lyon");
      expect(formatCityName("mArSeIlLe")).toBe("Marseille");
    });

    it("handles multiple spaces", () => {
      expect(formatCityName("  Les   Andelys  ")).toBe("Les Andelys");
    });

    it("handles empty strings and null", () => {
      expect(formatCityName("")).toBe(null);
      expect(formatCityName("   ")).toBe(null);
      expect(formatCityName("")).toBe(null);
    });

    it("handles names with apostrophe", () => {
      expect(formatCityName("L'Isle d'abeau")).toBe("L'Isle-d'Abeau");
    });
  });

  describe("isAdresseEmpty", () => {
    it("returns true when every field is blank and there is no typologie", () => {
      expect(isAdresseEmpty(makeEmptyAdresse())).toBe(true);
    });

    it("returns true when the typologie is present but holds no value", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [
              {
                year: 2026,
                placesAutorisees: null,
                logementSocial: false,
                qpv: false,
              },
            ],
          })
        )
      ).toBe(true);
    });

    it("returns false when adresseComplete is filled", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseComplete: "1 rue de la Paix, 75002 Paris",
          })
        )
      ).toBe(false);
    });

    it("returns false when adresse is filled", () => {
      expect(
        isAdresseEmpty(makeEmptyAdresse({ adresse: "1 rue de la Paix" }))
      ).toBe(false);
    });

    it("returns false when codePostal is filled", () => {
      expect(
        isAdresseEmpty(makeEmptyAdresse({ codePostal: "75002" }))
      ).toBe(false);
    });

    it("returns false when commune is filled", () => {
      expect(isAdresseEmpty(makeEmptyAdresse({ commune: "Paris" }))).toBe(
        false
      );
    });

    it("returns false when departement is filled", () => {
      expect(isAdresseEmpty(makeEmptyAdresse({ departement: "75" }))).toBe(
        false
      );
    });

    it("returns false when placesAutorisees is set", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, placesAutorisees: 10 }],
          })
        )
      ).toBe(false);
    });

    it("treats a placesAutorisees of 0 as a filled value", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, placesAutorisees: 0 }],
          })
        )
      ).toBe(false);
    });

    it("returns false when logementSocial is true", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, logementSocial: true }],
          })
        )
      ).toBe(false);
    });

    it("returns false when qpv is true", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, qpv: true }],
          })
        )
      ).toBe(false);
    });
  });
});
