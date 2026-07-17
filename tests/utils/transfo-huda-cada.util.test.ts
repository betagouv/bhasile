import { describe, expect, it } from "vitest";

import {
  normalizeBhasileCode,
  normalizeDnaCodes,
  parseFrenchDate,
  parseTransformationType,
} from "../../scripts/utils/transfo-huda-cada.util";

describe("transfo huda cada util", () => {
  describe("normalizeBhasileCode", () => {
    it("laisse intact un code déjà au format", () => {
      expect(normalizeBhasileCode("BHA-GES-054")).toBe("BHA-GES-054");
    });

    it("corrige un O en zéro dans le segment numérique", () => {
      expect(normalizeBhasileCode("BHA-NAQ-O50")).toBe("BHA-NAQ-050");
    });

    it("accepte les espaces à la place des tirets", () => {
      expect(normalizeBhasileCode("BHA IDF 034")).toBe("BHA-IDF-034");
    });

    it("extrait le code noyé dans de la prose", () => {
      expect(
        normalizeBhasileCode(
          "BHA-ARA-098 (le site H4204 compte pour 200 places parmi les 464 d'un multi-DNA)"
        )
      ).toBe("BHA-ARA-098");
    });

    it("rejette les non-valeurs saisies par les agents", () => {
      expect(normalizeBhasileCode("Multi DNA")).toBeNull();
      expect(normalizeBhasileCode("CPOM")).toBeNull();
      expect(normalizeBhasileCode("sous CPOM ")).toBeNull();
      expect(normalizeBhasileCode("HUDA multi-site")).toBeNull();
      expect(normalizeBhasileCode("en cours de saisie dans Bhasile")).toBeNull();
      expect(normalizeBhasileCode("établissement sous CPOM régional")).toBeNull();
    });

    it("rejette un code DNA saisi à la place du code Bhasile", () => {
      expect(normalizeBhasileCode("H2902 - HUDA ADOMA - ADOMA")).toBeNull();
    });
  });

  describe("normalizeDnaCodes", () => {
    it("renvoie un code simple", () => {
      expect(normalizeDnaCodes("H5412")).toEqual({
        codes: ["H5412"],
        unparsed: [],
      });
    });

    it("sépare les codes reliés par « et », y compris avec un espace parasite", () => {
      expect(normalizeDnaCodes("H8305 et H 8308").codes).toEqual([
        "H8305",
        "H8308",
      ]);
    });

    it("sépare les codes reliés par des tirets ou des espaces multiples", () => {
      expect(normalizeDnaCodes("H5901 - H5907 - H5908").codes).toEqual([
        "H5901",
        "H5907",
        "H5908",
      ]);
      expect(normalizeDnaCodes("A5001   A5002    T5003     ").codes).toEqual([
        "A5001",
        "A5002",
        "T5003",
      ]);
    });

    it("ignore les chiffres de SIRET qui ne sont pas des codes", () => {
      expect(
        normalizeDnaCodes(
          "H6919 - le SIRET du siège est le 326 922 879 00084, mais cette fiche a été enregistrée avec le SIRET de l'établissement"
        ).codes
      ).toEqual(["H6919"]);
    });

    it("remonte les codes malformés au lieu de les perdre", () => {
      const result = normalizeDnaCodes("H0203 H208 H209 H0211 H2012");
      expect(result.codes).toEqual(["H0203", "H0211", "H2012"]);
      expect(result.unparsed).toEqual(["H208", "H209"]);
    });

    it("recolle une lettre isolée aux chiffres qui la suivent", () => {
      expect(normalizeDnaCodes("H 0123").codes).toEqual(["H0123"]);
      expect(normalizeDnaCodes("H  0123").codes).toEqual(["H0123"]);
      expect(normalizeDnaCodes("H 0123 et H 0124").codes).toEqual([
        "H0123",
        "H0124",
      ]);
    });

    it("remonte les codes malformés même quand ils sont espacés", () => {
      expect(normalizeDnaCodes("H 208")).toEqual({
        codes: [],
        unparsed: ["H208"],
      });
      expect(normalizeDnaCodes("H0203 H 208 H0211")).toEqual({
        codes: ["H0203", "H0211"],
        unparsed: ["H208"],
      });
    });

    it("remonte un code trop long au lieu d'en tronquer les chiffres", () => {
      expect(normalizeDnaCodes("H 01234")).toEqual({
        codes: [],
        unparsed: ["H01234"],
      });
    });

    it("ne recolle pas une lettre de mot aux chiffres suivants", () => {
      expect(normalizeDnaCodes("le montant est de 3012 euros")).toEqual({
        codes: [],
        unparsed: [],
      });
    });

    it("accepte une saisie en minuscules", () => {
      expect(normalizeDnaCodes("h 0123").codes).toEqual(["H0123"]);
    });

    it("dédoublonne", () => {
      expect(normalizeDnaCodes("H5412 H5412").codes).toEqual(["H5412"]);
    });
  });

  describe("parseFrenchDate", () => {
    it("parse une date au format de Démarches Numériques", () => {
      expect(parseFrenchDate("01 juillet 2026")?.toISOString()).toBe(
        "2026-07-01T12:00:00.000Z"
      );
      expect(parseFrenchDate("15 mai 2026")?.toISOString()).toBe(
        "2026-05-15T12:00:00.000Z"
      );
    });

    it("gère les mois accentués", () => {
      expect(parseFrenchDate("03 février 2027")?.toISOString()).toBe(
        "2027-02-03T12:00:00.000Z"
      );
      expect(parseFrenchDate("09 août 2026")?.toISOString()).toBe(
        "2026-08-09T12:00:00.000Z"
      );
    });

    it("rejette une date ISO, que new Date() aurait pourtant acceptée", () => {
      expect(parseFrenchDate("2026-07-01")).toBeNull();
    });

    it("rejette un jour inexistant", () => {
      expect(parseFrenchDate("31 février 2026")).toBeNull();
    });

    it("rejette une chaîne vide ou un mois inconnu", () => {
      expect(parseFrenchDate("")).toBeNull();
      expect(parseFrenchDate("01 juilet 2026")).toBeNull();
    });
  });

  describe("parseTransformationType", () => {
    it("reconnaît les deux formulations de l'extension", () => {
      expect(parseTransformationType("Extension d'un CADA")).toBe(
        "TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR"
      );
      expect(
        parseTransformationType(
          "Extension d'un CADA (il est possible d'aller au-delà de 100% de la capacité existante)"
        )
      ).toBe("TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR");
    });

    it("reconnaît les deux formulations de la création", () => {
      expect(
        parseTransformationType(
          "Création d'un nouveau CADA (transformation d'un ou plusieurs HUDA en un nouveau CADA)"
        )
      ).toBe("TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR");
    });

    it("rejette un libellé inconnu", () => {
      expect(parseTransformationType("")).toBeNull();
      expect(parseTransformationType("Remise en concurrence")).toBeNull();
    });
  });
});
