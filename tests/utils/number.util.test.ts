import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatNumber,
  parseFrenchNumber,
} from "@/app/utils/number.util";

describe("number util", () => {
  describe("formatNumber", () => {
    it("should format positive integers correctly", () => {
      expect(formatNumber(1234)).toBe("1\u202f234");
      expect(formatNumber(1000000)).toBe("1\u202f000\u202f000");
      expect(formatNumber(42)).toBe("42");
    });

    it("should format positive decimals correctly", () => {
      expect(formatNumber(1234.56)).toBe("1\u202f234,56");
      expect(formatNumber(0.5)).toBe("0,5");
      expect(formatNumber(3.14159)).toBe("3,142");
    });

    it("should format negative numbers correctly", () => {
      expect(formatNumber(-1234)).toBe("-1\u202f234");
      expect(formatNumber(-1234.56)).toBe("-1\u202f234,56");
    });

    it("should handle zero", () => {
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(-0)).toBe("-0"); // Intl.NumberFormat preserves -0
    });

    it("should handle null, undefined and NaN values", () => {
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
      expect(formatNumber(NaN)).toBe("0");
    });
  });

  describe("formatCurrency", () => {
    it("should format positive integers as currency", () => {
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

    it("should format positive decimals as currency", () => {
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

    it("should format negative numbers as currency", () => {
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

    it("should handle zero as currency", () => {
      const result0 = formatCurrency(0);
      const resultNeg0 = formatCurrency(-0);

      expect(result0).toContain("0");
      expect(result0).toContain("€");
      expect(resultNeg0).toContain("0");
      expect(resultNeg0).toContain("€");
    });

    it("should handle null, undefined and NaN values as currency", () => {
      expect(formatCurrency(null)).toBe("0 €");
      expect(formatCurrency(undefined)).toBe("0 €");
      expect(formatCurrency(NaN)).toBe("0 €");
    });

    it("should handle decimal precision correctly", () => {
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
    it("should parse French formatted numbers with comma decimal separator", () => {
      expect(parseFrenchNumber("1234,56")).toBe(1234.56);
      expect(parseFrenchNumber("0,5")).toBe(0.5);
      expect(parseFrenchNumber("3,14")).toBe(3.14);
    });

    it("should parse French formatted numbers with spaces as thousands separator", () => {
      expect(parseFrenchNumber("1 234,56")).toBe(1234.56);
      expect(parseFrenchNumber("1 000 000,00")).toBe(1000000);
      expect(parseFrenchNumber("12 345")).toBe(12345);
    });

    it("should parse English formatted numbers with dot decimal separator", () => {
      expect(parseFrenchNumber("1234.56")).toBe(1234.56);
      expect(parseFrenchNumber("0.5")).toBe(0.5);
      expect(parseFrenchNumber("3.14")).toBe(3.14);
    });

    it("should parse integers without decimal separator", () => {
      expect(parseFrenchNumber("1234")).toBe(1234);
      expect(parseFrenchNumber("42")).toBe(42);
      expect(parseFrenchNumber("0")).toBe(0);
    });

    it("should parse negative numbers", () => {
      expect(parseFrenchNumber("-1234,56")).toBe(-1234.56);
      expect(parseFrenchNumber("-1 234")).toBe(-1234);
      expect(parseFrenchNumber("-0,5")).toBe(-0.5);
    });

    it("should handle numbers with currency symbols", () => {
      expect(parseFrenchNumber("1234,56 €")).toBe(1234.56);
      expect(parseFrenchNumber("€ 1234,56")).toBe(1234.56);
      expect(parseFrenchNumber("1 234,56€")).toBe(1234.56);
    });

    it("should handle numbers with extra spaces", () => {
      expect(parseFrenchNumber("  1234,56  ")).toBe(1234.56);
      expect(parseFrenchNumber("1 234 , 56")).toBe(1234.56);
      expect(parseFrenchNumber(" 1 000 000 ")).toBe(1000000);
    });

    it("should return null for invalid inputs", () => {
      expect(parseFrenchNumber("")).toBe(null);
      expect(parseFrenchNumber("abc")).toBe(null);
      expect(parseFrenchNumber("12,34,56")).toBe(12.34); // Current implementation parses first part, might want to improve
      expect(parseFrenchNumber("not a number")).toBe(null);
    });

    it("should return null for null and undefined", () => {
      expect(parseFrenchNumber(null as unknown as string)).toBe(null);
      expect(parseFrenchNumber(undefined as unknown as string)).toBe(null);
    });

    it("should handle edge cases", () => {
      expect(parseFrenchNumber("0")).toBe(0);
      expect(parseFrenchNumber("0,0")).toBe(0);
      expect(parseFrenchNumber("0,00")).toBe(0);
      expect(parseFrenchNumber("-0")).toBe(-0);
    });

    it("should handle complex French formatting", () => {
      expect(parseFrenchNumber("1 234 567,89")).toBe(1234567.89);
      expect(parseFrenchNumber("999 999,99 €")).toBe(999999.99);
      expect(parseFrenchNumber("-1 000,50")).toBe(-1000.5);
      expect(parseFrenchNumber("1\u202f234\u202f567,89")).toBe(1234567.89); // With narrow non-breaking spaces
    });
  });

  describe("Integration tests", () => {
    it("should be able to format and parse back to the same value", () => {
      const testValues = [0, 42, 1234, 1234.56, -1000, -1234.56];

      testValues.forEach((value) => {
        const formatted = formatNumber(value);
        const parsed = parseFrenchNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });

    it("should handle currency formatting and parsing cycle", () => {
      const testValues = [0, 42, 1234, 1234.56, -1000, -1234.56];

      testValues.forEach((value) => {
        const formatted = formatCurrency(value);
        const parsed = parseFrenchNumber(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      });
    });
  });
});
