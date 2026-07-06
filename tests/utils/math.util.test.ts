import { describe, expect, it } from "vitest";

import {
  aggregateValues,
  sumValues,
  weightedAverage,
} from "@/app/utils/math.util";

describe("math util", () => {
  describe("sum", () => {
    it("additionne les nombres", () => {
      expect(sumValues([1, 2, 3])).toBe(6);
      expect(sumValues([0, 10, -2])).toBe(8);
    });

    it("ignore null/undefined et retourne null quand il n'y a aucun nombre", () => {
      expect(sumValues([1, null, 2, undefined, 3])).toBe(6);
      expect(sumValues([null, undefined])).toBe(null);
      expect(sumValues([])).toBe(null);
    });
  });

  describe("weightedAverage", () => {
    it("calcule la moyenne pondérée", () => {
      expect(
        weightedAverage([
          { weight: 10, value: 0.5 },
          { weight: 30, value: 1 },
        ])
      ).toBeCloseTo(0.875, 6);
    });

    it("ignore les paires invalides et retourne null quand aucun poids n'est valide", () => {
      expect(
        weightedAverage([
          { weight: null, value: 0.5 },
          { weight: undefined, value: 1 },
          { weight: 0, value: 0.2 },
        ])
      ).toBe(null);
    });

    it("retourne null quand le poids total est nul", () => {
      expect(
        weightedAverage([
          { weight: 0, value: 0.5 },
          { weight: 0, value: 1 },
        ])
      ).toBe(null);
    });
  });

  describe("aggregateValues", () => {
    it("délègue à la moyenne ou à la médiane", () => {
      expect(aggregateValues([1, 2, 9], "moyenne")).toBe(4);
      expect(aggregateValues([1, 2, 9], "mediane")).toBe(2);
    });
  });
});
