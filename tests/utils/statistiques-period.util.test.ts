import { describe, expect, it } from "vitest";

import {
  filterDisplayedPeriods,
  filterDisplayedYears,
  getLastDisplayedPeriods,
  isYearIncomplete,
} from "@/app/utils/statistiques-period.util";
import { CURRENT_YEAR, START_YEAR } from "@/constants";
import { FinanceByYearStat } from "@/schemas/api/statistique.schema";

const periodOfYear = (year: number) => ({
  date: `${year}-06-15T00:00:00.000Z`,
});

describe("statistiques period util", () => {
  describe("filterDisplayedPeriods", () => {
    it("garde les périodes comprises entre START_YEAR et l'année courante", () => {
      const periods = [periodOfYear(START_YEAR), periodOfYear(CURRENT_YEAR)];

      expect(filterDisplayedPeriods(periods)).toEqual(periods);
    });

    it("exclut les périodes antérieures à START_YEAR", () => {
      expect(filterDisplayedPeriods([periodOfYear(START_YEAR - 1)])).toEqual(
        []
      );
    });

    it("exclut les périodes postérieures à l'année courante", () => {
      expect(filterDisplayedPeriods([periodOfYear(CURRENT_YEAR + 10)])).toEqual(
        []
      );
    });
  });

  describe("filterDisplayedYears", () => {
    it("ne garde que les millésimes affichables", () => {
      const items = [
        { year: START_YEAR - 5 },
        { year: START_YEAR },
        { year: CURRENT_YEAR },
        { year: 2205 },
      ];

      expect(filterDisplayedYears(items)).toEqual([
        { year: START_YEAR },
        { year: CURRENT_YEAR },
      ]);
    });
  });

  describe("getLastDisplayedPeriods", () => {
    it("trie les périodes de la plus ancienne à la plus récente", () => {
      const periods = [
        { date: `${CURRENT_YEAR}-03-01T00:00:00.000Z` },
        { date: `${CURRENT_YEAR}-01-01T00:00:00.000Z` },
        { date: `${CURRENT_YEAR}-02-01T00:00:00.000Z` },
      ];

      expect(getLastDisplayedPeriods(periods).map(({ date }) => date)).toEqual([
        `${CURRENT_YEAR}-01-01T00:00:00.000Z`,
        `${CURRENT_YEAR}-02-01T00:00:00.000Z`,
        `${CURRENT_YEAR}-03-01T00:00:00.000Z`,
      ]);
    });

    it("ne conserve que les 10 dernières périodes", () => {
      const previousYearPeriods = Array.from({ length: 12 }, (_, index) => ({
        date: `${CURRENT_YEAR - 1}-${String(index + 1).padStart(2, "0")}-01T00:00:00.000Z`,
      }));
      const currentYearPeriods = [
        { date: `${CURRENT_YEAR}-01-01T00:00:00.000Z` },
        { date: `${CURRENT_YEAR}-02-01T00:00:00.000Z` },
      ];

      const displayedPeriods = getLastDisplayedPeriods([
        ...previousYearPeriods,
        ...currentYearPeriods,
      ]);

      expect(displayedPeriods).toHaveLength(10);
      expect(displayedPeriods[0].date).toBe(
        `${CURRENT_YEAR - 1}-05-01T00:00:00.000Z`
      );
    });
  });

  describe("isYearIncomplete", () => {
    it("renvoie false si yearItem est undefined", () => {
      expect(isYearIncomplete(undefined)).toBe(false);
    });

    it("renvoie true pour l'année courante", () => {
      const yearItem = { year: CURRENT_YEAR } as FinanceByYearStat;

      expect(isYearIncomplete(yearItem)).toBe(true);
    });

    it("renvoie true pour l'année précédente (N-1)", () => {
      const yearItem = { year: CURRENT_YEAR - 1 } as FinanceByYearStat;

      expect(isYearIncomplete(yearItem)).toBe(true);
    });

    it("renvoie false pour une année antérieure à N-1", () => {
      const yearItem = { year: CURRENT_YEAR - 2 } as FinanceByYearStat;

      expect(isYearIncomplete(yearItem)).toBe(false);
    });

    it("renvoie false pour une année future", () => {
      const yearItem = { year: CURRENT_YEAR + 1 } as FinanceByYearStat;

      expect(isYearIncomplete(yearItem)).toBe(false);
    });

    it("gère la propriété year sous forme de chaîne de caractères", () => {
      const yearItem = {
        year: String(CURRENT_YEAR),
      } as unknown as FinanceByYearStat;

      expect(isYearIncomplete(yearItem)).toBe(true);
    });
  });
});
