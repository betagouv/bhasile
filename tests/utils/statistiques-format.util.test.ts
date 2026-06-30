import { describe, expect, it } from "vitest";

import {
  roundStatsNumber,
  roundStatsRate,
} from "@/app/utils/statistiques-format.util";

describe("statistiques format utils", () => {
  describe("roundStatsNumber", () => {
    it("should round to one decimal", () => {
      expect(roundStatsNumber(1.234)).toBe(1.2);
      expect(roundStatsNumber(null)).toBeNull();
    });
  });

  describe("roundStatsRate", () => {
    it("should round to three significant digits", () => {
      expect(roundStatsRate(0.000_012_345)).toBe(0.000_012_3);
      expect(roundStatsRate(0.123_45)).toBe(0.123);
      expect(roundStatsRate(1.234_5)).toBe(1.23);
      expect(roundStatsRate(0.987_654)).toBe(0.988);
    });

    it("should preserve small equipment rates", () => {
      expect(roundStatsRate(4155 / 59_931_329)).toBe(0.000_069_3);
    });

    it("should handle null and zero", () => {
      expect(roundStatsRate(null)).toBeNull();
      expect(roundStatsRate(0)).toBe(0);
    });
  });
});
