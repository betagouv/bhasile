import { describe, expect, it } from "vitest";

import {
  getLatestBudgetExecutoireYear,
  isInputDisabled,
} from "@/app/utils/budget.util";
import { CURRENT_YEAR } from "@/constants";
import { BudgetApiType } from "@/schemas/api/budget.schema";

const OPEN_YEAR = 2025;

const budget = (
  year: number,
  dotationAccordee: number | null | undefined
): BudgetApiType => ({ year, dotationAccordee }) as BudgetApiType;

describe("budget util", () => {
  describe("getLatestBudgetExecutoireYear", () => {
    it("retourne l'année la plus récente dont la dotation est renseignée", () => {
      const budgets = [budget(2025, null), budget(2024, 100), budget(2023, 50)];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(2024);
    });

    it("ignore les années dont la dotation est null ou undefined", () => {
      const budgets = [
        budget(2025, null),
        budget(2024, undefined),
        budget(2023, 50),
      ];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(2023);
    });

    it("ne considère pas une dotation de 0 comme renseignée", () => {
      const budgets = [budget(2025, 0), budget(2024, 100)];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(2024);
    });

    it("ne dépend pas de l'ordre du tableau", () => {
      const budgets = [budget(2023, 50), budget(2025, 100), budget(2024, 80)];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(2025);
    });

    it("retourne une année supérieure à openYear si elle est renseignée", () => {
      const budgets = [budget(2026, 100), budget(2024, 80)];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(2026);
    });

    it("retourne openYear quand aucune dotation n'est renseignée", () => {
      const budgets = [budget(2025, null), budget(2024, null)];
      expect(getLatestBudgetExecutoireYear(budgets, OPEN_YEAR)).toBe(OPEN_YEAR);
    });

    it("retourne openYear quand le tableau est vide ou indéfini", () => {
      expect(getLatestBudgetExecutoireYear([], OPEN_YEAR)).toBe(OPEN_YEAR);
      expect(getLatestBudgetExecutoireYear(undefined, OPEN_YEAR)).toBe(
        OPEN_YEAR
      );
    });
  });

  describe("isInputDisabled", () => {
    it("grise le réalisé de l'année en cours pour les indicateurs financiers", () => {
      expect(isInputDisabled(CURRENT_YEAR, "REALISE")).toBe(true);
    });

    it("laisse le prévisionnel de l'année en cours remplissable", () => {
      expect(isInputDisabled(CURRENT_YEAR, "PREVISIONNEL")).toBe(false);
    });

    it("laisse le réalisé des années passées remplissable", () => {
      expect(isInputDisabled(CURRENT_YEAR - 1, "REALISE")).toBe(false);
    });
  });
});
