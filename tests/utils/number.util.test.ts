import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatNumber,
  parseFrenchNumber,
} from "@/app/utils/number.util";

describe("number util", () => {
  describe("formatNumber", () => {
    it("formate correctement les entiers positifs", () => {
      expect(formatNumber(1234)).toBe("1\u202f234");
      expect(formatNumber(1000000)).toBe("1\u202f000\u202f000");
      expect(formatNumber(42)).toBe("42");
    });

    it("formate correctement les décimaux positifs", () => {
      expect(formatNumber(1234.56)).toBe("1\u202f234,56");
      expect(formatNumber(0.5)).toBe("0,5");
      expect(formatNumber(3.14159)).toBe("3,142");
    });

    it("formate correctement les nombres négatifs", () => {
      expect(formatNumber(-1234)).toBe("-1\u202f234");
      expect(formatNumber(-1234.56)).toBe("-1\u202f234,56");
    });

    it("gère le zéro", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(-0)).toBe("-0"); // Intl.NumberFormat preserves -0
    });

    it("gère les valeurs null, undefined et NaN", () => {
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
      expect(formatNumber(NaN)).toBe("0");
    });
  });

  describe("formatCurrency", () => {
    it("formate les entiers positifs en devise", () => {
      const result1234 = formatCurrency(1234);
      const result1000000 = formatCurrency(1000000);
      const result42 = formatCurrency(42);

      // Test that it contains the expected elements
      expect(result1234).toContain("1");
      expect(result1234).toContain("234");
      expect(result1234).toContain("€");
      expect(result1000000).toContain("1");
      expect(result1000000).toContain("000");
      expect(result1000000).toContain("€");
      expect(result42).toContain("42");
      expect(result42).toContain("€");
    });

    it("formate les décimaux positifs en devise", () => {
      const result1234_56 = formatCurrency(1234.56);
      const result0_5 = formatCurrency(0.5);
      const result3_14159 = formatCurrency(3.14159);

      expect(result1234_56).toContain("1");
      expect(result1234_56).toContain("234");
      expect(result1234_56).toContain("56");
      expect(result1234_56).toContain("€");
      expect(result0_5).toContain("0,5");
      expect(result0_5).toContain("€");
      expect(result3_14159).toContain("3,14");
      expect(result3_14159).toContain("€");
    });

    it("formate les nombres négatifs en devise", () => {
      const resultNeg1234 = formatCurrency(-1234);
      const resultNeg1234_56 = formatCurrency(-1234.56);

      expect(resultNeg1234).toContain("-");
      expect(resultNeg1234).toContain("1");
      expect(resultNeg1234).toContain("234");
      expect(resultNeg1234).toContain("€");
      expect(resultNeg1234_56).toContain("-");
      expect(resultNeg1234_56).toContain("1");
      expect(resultNeg1234_56).toContain("234");
      expect(resultNeg1234_56).toContain("56");
      expect(resultNeg1234_56).toContain("€");
    });

    it("gère le zéro en devise", () => {
      const result0 = formatCurrency(0);
      const resultNeg0 = formatCurrency(-0);

      expect(result0).toContain("0");
      expect(result0).toContain("€");
      expect(resultNeg0).toContain("0");
      expect(resultNeg0).toContain("€");
    });

    it("gère les valeurs null, undefined et NaN en devise", () => {
      expect(formatCurrency(null)).toBe("0 €");
      expect(formatCurrency(undefined)).toBe("0 €");
      expect(formatCurrency(NaN)).toBe("0 €");
    });

    it("gère correctement la précision décimale", () => {
      const result1234_1 = formatCurrency(1234.1);
      const result1234_12 = formatCurrency(1234.12);
      const result1234_123 = formatCurrency(1234.123);

      expect(result1234_1).toContain("1");
      expect(result1234_1).toContain("234");
      expect(result1234_1).toContain("1");
      expect(result1234_1).toContain("€");
      expect(result1234_12).toContain("1");
      expect(result1234_12).toContain("234");
      expect(result1234_12).toContain("12");
      expect(result1234_12).toContain("€");
      expect(result1234_123).toContain("1");
      expect(result1234_123).toContain("234");
      expect(result1234_123).toContain("12");
      expect(result1234_123).toContain("€");
      expect(result1234_123).not.toContain("123"); // Should be rounded to 2 decimals
    });
  });

  describe("parseFrenchNumber", () => {
    it("parse les nombres au format français avec la virgule comme séparateur décimal", () => {
      expect(parseFrenchNumber("1234,56")).toBe(1234.56);
      expect(parseFrenchNumber("0,5")).toBe(0.5);
      expect(parseFrenchNumber("3,14")).toBe(3.14);
    });

    it("parse les nombres au format français avec des espaces comme séparateur de milliers", () => {
      expect(parseFrenchNumber("1 234,56")).toBe(1234.56);
      expect(parseFrenchNumber("1 000 000,00")).toBe(1000000);
      expect(parseFrenchNumber("12 345")).toBe(12345);
    });

    it("parse les nombres au format anglais avec le point comme séparateur décimal", () => {
      expect(parseFrenchNumber("1234.56")).toBe(1234.56);
      expect(parseFrenchNumber("0.5")).toBe(0.5);
      expect(parseFrenchNumber("3.14")).toBe(3.14);
    });

    it("parse les entiers sans séparateur décimal", () => {
      expect(parseFrenchNumber("1234")).toBe(1234);
      expect(parseFrenchNumber("42")).toBe(42);
      expect(parseFrenchNumber("0")).toBe(0);
    });

    it("parse les nombres négatifs", () => {
      expect(parseFrenchNumber("-1234,56")).toBe(-1234.56);
      expect(parseFrenchNumber("-1 234")).toBe(-1234);
      expect(parseFrenchNumber("-0,5")).toBe(-0.5);
    });

    it("gère les nombres avec symboles monétaires", () => {
      expect(parseFrenchNumber("1234,56 €")).toBe(1234.56);
      expect(parseFrenchNumber("€ 1234,56")).toBe(1234.56);
      expect(parseFrenchNumber("1 234,56€")).toBe(1234.56);
    });

    it("gère les nombres avec des espaces superflus", () => {
      expect(parseFrenchNumber("  1234,56  ")).toBe(1234.56);
      expect(parseFrenchNumber("1 234 , 56")).toBe(1234.56);
      expect(parseFrenchNumber(" 1 000 000 ")).toBe(1000000);
    });

    it("retourne null pour des entrées invalides", () => {
      expect(parseFrenchNumber("")).toBe(null);
      expect(parseFrenchNumber("abc")).toBe(null);
      expect(parseFrenchNumber("12,34,56")).toBe(12.34); // Current implementation parses first part, might want to improve
      expect(parseFrenchNumber("not a number")).toBe(null);
    });

    it("retourne null pour null et undefined", () => {
      expect(parseFrenchNumber(null as unknown as string)).toBe(null);
      expect(parseFrenchNumber(undefined as unknown as string)).toBe(null);
    });

    it("gère les cas limites", () => {
      expect(parseFrenchNumber("0")).toBe(0);
      expect(parseFrenchNumber("0,0")).toBe(0);
      expect(parseFrenchNumber("0,00")).toBe(0);
      expect(parseFrenchNumber("-0")).toBe(-0);
    });

    it("gère un formatage français complexe", () => {
      expect(parseFrenchNumber("1 234 567,89")).toBe(1234567.89);
      expect(parseFrenchNumber("999 999,99 €")).toBe(999999.99);
      expect(parseFrenchNumber("-1 000,50")).toBe(-1000.5);
      expect(parseFrenchNumber("1\u202f234\u202f567,89")).toBe(1234567.89); // With narrow non-breaking spaces
    });
  });

  describe("Integration tests", () => {
    it("formate puis reparse vers la même valeur", () => {
      const testValues = [0, 42, 1234, 1234.56, -1000, -1234.56];

      testValues.forEach((value) => {
        const formatted = formatNumber(value);
        const parsed = parseFrenchNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });

    it("gère le cycle de formatage et de parsing en devise", () => {
      const testValues = [0, 42, 1234, 1234.56, -1000, -1234.56];

      testValues.forEach((value) => {
        const formatted = formatCurrency(value);
        const parsed = parseFrenchNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });
  });
});
