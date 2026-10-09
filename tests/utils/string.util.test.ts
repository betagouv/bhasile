import { describe, expect, it } from "vitest";

import {
  capitalizeFirstLetter,
  formatFirstWithRestCount,
  formatPlural,
  matchesSearchQuery,
  normalizeAccents,
  parseId,
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

    it("décompose les ligatures que la normalisation Unicode laisse intactes", () => {
      expect(normalizeAccents("Cœur")).toBe("coeur");
      expect(normalizeAccents("Œuvre")).toBe("oeuvre");
      expect(normalizeAccents("Ex æquo")).toBe("ex aequo");
    });
  });

  describe("matchesSearchQuery", () => {
    it("retourne vrai pour une correspondance exacte", () => {
      expect(matchesSearchQuery("Finistère", "Finistère")).toBe(true);
    });

    it("est insensible à la casse et aux accents", () => {
      expect(matchesSearchQuery("Finistère", "finistere")).toBe(true);
      expect(matchesSearchQuery("ÎLE-DE-FRANCE", "ile de france")).toBe(true);
    });

    it("est insensible aux tirets, apostrophes et espaces multiples", () => {
      expect(matchesSearchQuery("Ille-et-Vilaine", "ille et vilaine")).toBe(
        true
      );
      expect(matchesSearchQuery("Côtes-d'Armor", "cotes d armor")).toBe(true);
      expect(matchesSearchQuery("Val-d'Oise", "val-d'oise")).toBe(true);
    });

    it("prend en compte les recherches partielles", () => {
      expect(matchesSearchQuery("Ille-et-Vilaine", "vilaine")).toBe(true);
      expect(matchesSearchQuery("Finistère", "fini")).toBe(true);
    });

    it("retourne vrai lorsque la recherche est vide ou constituée d'espaces", () => {
      expect(matchesSearchQuery("Finistère", "")).toBe(true);
      expect(matchesSearchQuery("Finistère", "   ")).toBe(true);
    });

    it("retourne faux lorsqu'il n'y a pas de correspondance", () => {
      expect(matchesSearchQuery("Finistère", "Gironde")).toBe(false);
      expect(matchesSearchQuery("Finistère", "29")).toBe(false);
    });
  });

  describe("capitalizeFirstLetter", () => {
    it("préserve une chaîne déjà capitalisée", () => {
      expect(capitalizeFirstLetter("Hello")).toBe("Hello");
    });
    it("gère une chaîne vide", () => {
      expect(capitalizeFirstLetter("")).toBe("");
    });
    it("gère les chaînes commençant par un caractère non alphabétique", () => {
      expect(capitalizeFirstLetter("1hello")).toBe("1hello");
    });
    it("gère les caractères accentués", () => {
      expect(capitalizeFirstLetter("école")).toBe("École");
      expect(capitalizeFirstLetter("été")).toBe("Été");
    });
    it("capitalise la première lettre d'une chaîne de plusieurs mots", () => {
      expect(capitalizeFirstLetter("hello world")).toBe("Hello world");
    });
    it("retourne une chaîne vide quand on passe null", () => {
      expect(capitalizeFirstLetter(null)).toBe("");
    });
    it("retourne une chaîne vide quand on passe undefined", () => {
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

  describe("formatFirstWithRestCount", () => {
    it("renvoie undefined pour une liste vide", () => {
      expect(formatFirstWithRestCount([])).toBeUndefined();
    });

    it("renvoie l'élément seul quand la liste n'en contient qu'un", () => {
      expect(formatFirstWithRestCount(["Bretagne"])).toBe("Bretagne");
    });

    it("compte les éléments au-delà du premier", () => {
      expect(formatFirstWithRestCount(["Bretagne", "Calvados", "Orne"])).toBe(
        "Bretagne +2"
      );
    });
  });

  describe("parseId", () => {
    it("renvoie le nombre pour une suite de chiffres", () => {
      expect(parseId("42")).toBe(42);
    });

    it("renvoie null pour tout ce que Number() accepterait à tort", () => {
      expect(parseId("1e3")).toBeNull();
      expect(parseId("+12")).toBeNull();
      expect(parseId("12.0")).toBeNull();
      expect(parseId(" 12 ")).toBeNull();
      expect(parseId("abc")).toBeNull();
      expect(parseId("")).toBeNull();
    });
  });
});
