import { describe, expect, it } from "vitest";

import {
  isAmbiguousFusion,
  isDnaCodeInDepartement,
  isEffectiveDateInScope,
  normalizeBhasileCodes,
  normalizeDnaCodes,
  padDnaCode,
  parseDepartement,
  parseDnaCodes,
  parseFrenchDate,
  parseTransformationType,
} from "../../scripts/utils/transfo-huda-cada.util";

describe("transfo huda cada util", () => {
  describe("normalizeBhasileCodes", () => {
    it("laisse intact un code déjà au format", () => {
      expect(normalizeBhasileCodes("BHA-GES-054")).toEqual(["BHA-GES-054"]);
    });

    it("corrige un O en zéro dans le segment numérique", () => {
      expect(normalizeBhasileCodes("BHA-NAQ-O50")).toEqual(["BHA-NAQ-050"]);
    });

    it("accepte les espaces à la place des tirets", () => {
      expect(normalizeBhasileCodes("BHA IDF 034")).toEqual(["BHA-IDF-034"]);
    });

    it("extrait le code noyé dans de la prose", () => {
      expect(
        normalizeBhasileCodes(
          "BHA-ARA-098 (le site H4204 compte pour 200 places parmi les 464 d'un multi-DNA)"
        )
      ).toEqual(["BHA-ARA-098"]);
    });

    it("extrait tous les codes quand le champ en contient plusieurs", () => {
      expect(normalizeBhasileCodes("BHA-ARA-001 et BHA-ARA-002")).toEqual([
        "BHA-ARA-001",
        "BHA-ARA-002",
      ]);
    });

    it("corrige le O sur chacun et dédoublonne", () => {
      expect(
        normalizeBhasileCodes("BHA-NAQ-O50, BHA-NAQ-050 et BHA IDF O34")
      ).toEqual(["BHA-NAQ-050", "BHA-IDF-034"]);
    });

    it("rejette les non-valeurs saisies par les agents", () => {
      expect(normalizeBhasileCodes("Multi DNA")).toEqual([]);
      expect(normalizeBhasileCodes("CPOM")).toEqual([]);
      expect(normalizeBhasileCodes("sous CPOM ")).toEqual([]);
      expect(normalizeBhasileCodes("HUDA multi-site")).toEqual([]);
      expect(normalizeBhasileCodes("en cours de saisie dans Bhasile")).toEqual(
        []
      );
      expect(normalizeBhasileCodes("établissement sous CPOM régional")).toEqual(
        []
      );
    });

    it("rejette un code DNA saisi à la place du code Bhasile", () => {
      expect(normalizeBhasileCodes("H2902 - HUDA ADOMA - ADOMA")).toEqual([]);
    });

    it("ne se laisse pas piéger par l'état du regex global entre deux appels", () => {
      expect(normalizeBhasileCodes("BHA-ARA-001")).toEqual(["BHA-ARA-001"]);
      expect(normalizeBhasileCodes("BHA-ARA-001")).toEqual(["BHA-ARA-001"]);
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

  describe("parseDepartement", () => {
    it("extrait le numéro du libellé Démarches Numériques", () => {
      expect(parseDepartement("02 - Aisne")).toBe("02");
      expect(parseDepartement("974 - La Réunion")).toBe("974");
    });

    it("accepte la Corse", () => {
      expect(parseDepartement("2A - Corse-du-Sud")).toBe("2A");
    });

    it("rejette une valeur inexploitable", () => {
      expect(parseDepartement("")).toBeNull();
      expect(parseDepartement("Aisne")).toBeNull();
    });
  });

  describe("padDnaCode", () => {
    it("insère le zéro manquant après la lettre", () => {
      expect(padDnaCode("H209")).toBe("H0209");
    });

    it("laisse intact un code déjà complet ou trop court", () => {
      expect(padDnaCode("H0209")).toBeNull();
      expect(padDnaCode("H20")).toBeNull();
    });
  });

  describe("isDnaCodeInDepartement", () => {
    it("compare les deux chiffres qui suivent la lettre", () => {
      expect(isDnaCodeInDepartement("H0209", "02")).toBe(true);
      expect(isDnaCodeInDepartement("H2012", "02")).toBe(false);
    });

    it("compare l'outre-mer sur les deux premiers chiffres", () => {
      expect(isDnaCodeInDepartement("H9741", "974")).toBe(true);
      expect(isDnaCodeInDepartement("H0209", "974")).toBe(false);
    });

    it("laisse passer quand le département est inconnu ou corse", () => {
      expect(isDnaCodeInDepartement("H0209", null)).toBe(true);
      expect(isDnaCodeInDepartement("H2012", "2A")).toBe(true);
    });
  });

  describe("parseDnaCodes", () => {
    it("sépare les codes valides, les candidats au padding et les rejets", () => {
      const result = parseDnaCodes(["H0203 H208 H209 H0211 H2012"], "02");

      expect(result.codes).toEqual(["H0203", "H0211"]);
      expect([...result.padded]).toEqual([
        ["H208", "H0208"],
        ["H209", "H0209"],
      ]);
      expect(result.outsideDepartement).toEqual(["H2012"]);
      expect(result.unreadable).toEqual([]);
    });

    it("agrège plusieurs champs et dédoublonne", () => {
      expect(parseDnaCodes(["H8305 et H 8308", "H8305"], "83").codes).toEqual([
        "H8305",
        "H8308",
      ]);
    });

    it("ignore un candidat dont le code padé est déjà saisi correctement", () => {
      const result = parseDnaCodes(["H0209 H209"], "02");

      expect(result.codes).toEqual(["H0209"]);
      expect(result.padded.size).toBe(0);
      expect(result.unreadable).toEqual([]);
    });

    it("ne pade pas un code dont le département ne colle pas", () => {
      const result = parseDnaCodes(["H209"], "35");

      expect(result.padded.size).toBe(0);
      expect(result.unreadable).toEqual(["H209"]);
    });
  });

  describe("isEffectiveDateInScope", () => {
    it("accepte une date à partir de 2026", () => {
      expect(isEffectiveDateInScope(new Date("2026-01-01T12:00:00Z"))).toBe(
        true
      );
      expect(isEffectiveDateInScope(new Date("2027-06-15T12:00:00Z"))).toBe(
        true
      );
    });

    it("rejette une date antérieure à 2026", () => {
      expect(isEffectiveDateInScope(new Date("2025-12-31T12:00:00Z"))).toBe(
        false
      );
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

    it("rejette la variante qui mêle création et fusion d'un CADA existant", () => {
      expect(parseTransformationType(FUSION_LABEL)).toBeNull();
      expect(isAmbiguousFusion(FUSION_LABEL)).toBe(true);
    });

    it("ne prend pas la formulation de création simple pour une fusion", () => {
      expect(
        isAmbiguousFusion(
          "Création d'un nouveau CADA (transformation d'un ou plusieurs HUDA en un nouveau CADA)"
        )
      ).toBe(false);
      expect(isAmbiguousFusion("Extension d'un CADA")).toBe(false);
    });

    it("rejette un libellé inconnu", () => {
      expect(parseTransformationType("")).toBeNull();
      expect(parseTransformationType("Remise en concurrence")).toBeNull();
    });
  });
});

/* Libellé exact d'une ancienne révision du formulaire Démarches Numériques */
const FUSION_LABEL =
  "Création d'un nouveau CADA (transformation d'un ou plusieurs HUDA en un nouveau CADA OU \"fusion\" d'un CADA existant et d'un ou plusieurs HUDA représentant plus de 100 % de la capacité du CADA existant)";
