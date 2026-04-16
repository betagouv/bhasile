import { describe, expect, it } from "vitest";

import { sumValues, weightedAverage } from "@/app/utils/math.util";

describe("math util", () => {
  describe("sum", () => {
    it("should sum numbers", () => {
      expect(sumValues([1, 2, 3])).toBe(6);
      expect(sumValues([0, 10, -2])).toBe(8);
    });

    it("should ignore null/undefined and return null when no numbers", () => {
      expect(sumValues([1, null, 2, undefined, 3])).toBe(6);
      expect(sumValues([null, undefined])).toBe(null);
      expect(sumValues([])).toBe(null);
    });
  });

  describe("weightedAverage", () => {
    it("should compute weighted average", () => {
      expect(
        weightedAverage([
          { weight: 10, value: 0.5 },
          { weight: 30, value: 1 },
        ])
      ).toBeCloseTo(0.875, 6);
    });

    it("should ignore invalid pairs and return null when no valid weights", () => {
      expect(
        weightedAverage([
          { weight: null, value: 0.5 },
          { weight: undefined, value: 1 },
          { weight: 0, value: 0.2 },
        ])
      ).toBe(null);
    });

    it("should return null when total weight is zero", () => {
      expect(
        weightedAverage([
          { weight: 0, value: 0.5 },
          { weight: 0, value: 1 },
        ])
      ).toBe(null);
    });
  });
});
