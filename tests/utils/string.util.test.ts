import { describe, expect, it } from "vitest";

import {
  capitalizeFirstLetter,
  formatPlural,
  normalizeAccents,
  pluralize,
} from "@/app/utils/string.util";

describe("string util", () => {
  describe("normalizeAccents", () => {
    it("supprime les accents et met en minuscule", () => {
      expect(normalizeAccents("Éléphant")).toBe("elephant");
      expect(normalizeAccents("àéîõü")).toBe("aeiou");
      expect(normalizeAccents("ÇA MARCHE")).toBe("ca marche");
      expect(normalizeAccents("Crème brûlée")).toBe("creme brulee");
      expect(normalizeAccents("façade")).toBe("facade");
    });

    it("gère les chaînes sans accents", () => {
      expect(normalizeAccents("Hello World")).toBe("hello world");
      expect(normalizeAccents("test123")).toBe("test123");
    });

    it("gère les chaînes vides", () => {
      expect(normalizeAccents("")).toBe("");
    });

    it("gère les caractères spéciaux non accentués", () => {
      expect(normalizeAccents("déjà-vu!")).toBe("deja-vu!");
      expect(normalizeAccents("mañana@2024")).toBe("manana@2024");
    });

    it("gère les caractères accentués mélangés à des caractères non accentués", () => {
      expect(normalizeAccents("Joël & Zoë")).toBe("joel & zoe");
    });
  });
  describe("capitalizeFirstLetter", () => {
    it("preserve already capitalized string", () => {
      expect(capitalizeFirstLetter("Hello")).toBe("Hello");
    });
    it("handle empty string", () => {
      expect(capitalizeFirstLetter("")).toBe("");
    });
    it("handle strings starting with non-alphabetic character", () => {
      expect(capitalizeFirstLetter("1hello")).toBe("1hello");
    });
    it("handle accented characters", () => {
      expect(capitalizeFirstLetter("école")).toBe("École");
      expect(capitalizeFirstLetter("été")).toBe("Été");
    });
    it("capitalize first letter of multiword string", () => {
      expect(capitalizeFirstLetter("hello world")).toBe("Hello world");
    });
    it("returns empty string when given null", () => {
      expect(capitalizeFirstLetter(null)).toBe("");
    });
    it("returns empty string when given undefined", () => {
      expect(capitalizeFirstLetter(undefined)).toBe("");
    });
  });
  describe("formatPlural", () => {
    it("ne met pas de 's' au singulier ni à zéro", () => {
      expect(formatPlural(0, "entrée")).toBe("0 entrée");
      expect(formatPlural(1, "entrée")).toBe("1 entrée");
    });
    it("met un 's' au pluriel", () => {
      expect(formatPlural(2, "entrée")).toBe("2 entrées");
    });
    it("traite undefined comme zéro", () => {
      expect(formatPlural(undefined, "entrée")).toBe("0 entrée");
    });
  });
  describe("pluralize", () => {
    it("ne met pas de 's' au singulier ni à zéro, sans préfixer le nombre", () => {
      expect(pluralize(0, "structure")).toBe("structure");
      expect(pluralize(1, "structure")).toBe("structure");
    });
    it("met un 's' au pluriel sans préfixer le nombre", () => {
      expect(pluralize(2, "structure")).toBe("structures");
    });
    it("traite undefined comme zéro", () => {
      expect(pluralize(undefined, "Département")).toBe("Département");
    });
  });
});
