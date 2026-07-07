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
    it("retourne les deux premiers chiffres pour un code postal métropolitain", () => {
      expect(getDepartementFromCodePostal("75011")).toBe("75");
    });

    it("retourne les trois premiers chiffres pour un code postal d'outre-mer", () => {
      expect(getDepartementFromCodePostal("97100")).toBe("971");
      expect(getDepartementFromCodePostal("98630")).toBe("986");
    });

    it("supprime les espaces avant d'extraire le code département", () => {
      expect(getDepartementFromCodePostal("  13008  ")).toBe("13");
    });
  });

  describe("formatCityName", () => {
    it("formate correctement les noms avec des traits d'union", () => {
      expect(formatCityName("Gamaches en Vexin")).toBe("Gamaches-en-Vexin");
      expect(formatCityName("Ivry la Bataille")).toBe("Ivry-la-Bataille");
      expect(formatCityName("Neuilly sur Seine")).toBe("Neuilly-sur-Seine");
    });

    it("gère les articles en début de nom sans trait d'union", () => {
      expect(formatCityName("Les Andelys")).toBe("Les Andelys");
      expect(formatCityName("Le Grau du Roi")).toBe("Le Grau-du-Roi");
      expect(formatCityName("La Rochelle")).toBe("La Rochelle");
    });

    it("gère les noms composés de plusieurs mots", () => {
      expect(formatCityName("Rueil-malmaison")).toBe("Rueil-Malmaison");
    });

    it("met en minuscule les prépositions et les articles internes", () => {
      expect(formatCityName("Neuilly Sur Seine")).toBe("Neuilly-sur-Seine");
      expect(formatCityName("Le Grau du Roi")).toBe("Le Grau-du-Roi");
      expect(formatCityName("Ville sous Bois")).toBe("Ville-sous-Bois");
      expect(formatCityName("Ivry La Bataille")).toBe("Ivry-la-Bataille");
      expect(formatCityName("Aulnay-Sous-Bois")).toBe("Aulnay-sous-Bois");
    });

    it("capitalise correctement tous les autres mots", () => {
      expect(formatCityName("PARIS")).toBe("Paris");
      expect(formatCityName("lyon")).toBe("Lyon");
      expect(formatCityName("mArSeIlLe")).toBe("Marseille");
    });

    it("gère les espaces multiples", () => {
      expect(formatCityName("  Les   Andelys  ")).toBe("Les Andelys");
    });

    it("gère les chaînes vides et null", () => {
      expect(formatCityName("")).toBe(null);
      expect(formatCityName("   ")).toBe(null);
      expect(formatCityName("")).toBe(null);
    });

    it("gère les noms avec apostrophe", () => {
      expect(formatCityName("L'Isle d'abeau")).toBe("L'Isle-d'Abeau");
    });
  });

  describe("isAdresseEmpty", () => {
    it("retourne true quand tous les champs sont vides et qu'il n'y a pas de typologie", () => {
      expect(isAdresseEmpty(makeEmptyAdresse())).toBe(true);
    });

    it("retourne true quand la typologie est présente mais ne porte aucune valeur", () => {
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

    it("retourne false quand adresseComplete est renseigné", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseComplete: "1 rue de la Paix, 75002 Paris",
          })
        )
      ).toBe(false);
    });

    it("retourne false quand adresse est renseigné", () => {
      expect(
        isAdresseEmpty(makeEmptyAdresse({ adresse: "1 rue de la Paix" }))
      ).toBe(false);
    });

    it("retourne false quand codePostal est renseigné", () => {
      expect(
        isAdresseEmpty(makeEmptyAdresse({ codePostal: "75002" }))
      ).toBe(false);
    });

    it("retourne false quand commune est renseigné", () => {
      expect(isAdresseEmpty(makeEmptyAdresse({ commune: "Paris" }))).toBe(
        false
      );
    });

    it("retourne false quand departement est renseigné", () => {
      expect(isAdresseEmpty(makeEmptyAdresse({ departement: "75" }))).toBe(
        false
      );
    });

    it("retourne false quand placesAutorisees est renseigné", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, placesAutorisees: 10 }],
          })
        )
      ).toBe(false);
    });

    it("considère une valeur placesAutorisees de 0 comme renseignée", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, placesAutorisees: 0 }],
          })
        )
      ).toBe(false);
    });

    it("retourne false quand logementSocial est true", () => {
      expect(
        isAdresseEmpty(
          makeEmptyAdresse({
            adresseTypologies: [{ year: 2026, logementSocial: true }],
          })
        )
      ).toBe(false);
    });

    it("retourne false quand qpv est true", () => {
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
