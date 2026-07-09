import { describe, expect, it } from "vitest";

import {
  getBudgetDetailPathsToClear,
  getLatestBudgetExecutoireYear,
} from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { StructureType } from "@/types/structure.type";

const OPEN_YEAR = 2025;

const budget = (
  year: number,
  dotationAccordee: number | null | undefined
): BudgetApiType => ({ year, dotationAccordee }) as BudgetApiType;

describe("budget util", () => {
  describe("getLatestBudgetExecutoireYear", () => {
    it("retourne l'année la plus récente dont la dotation est renseignée", () => {
      const budgets = [
        budget(2025, null),
        budget(2024, 100),
        budget(2023, 50),
      ];
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

  describe("getBudgetDetailPathsToClear", () => {
    const budgetWithDetails = (
      overrides: Partial<BudgetApiType>
    ): BudgetApiType =>
      ({
        year: 2024,
        affectationReservesFondsDedies: 1000,
        reserveInvestissement: 100,
        chargesNonReconductibles: 200,
        reserveCompensationDeficits: null,
        reserveCompensationBFR: null,
        reserveCompensationAmortissements: null,
        reportANouveau: null,
        autre: null,
        ...overrides,
      }) as BudgetApiType;

    it("vide les détails renseignés quand l'affectation vaut 0", () => {
      const budgets = [
        budgetWithDetails({ affectationReservesFondsDedies: 0 }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([
        "budgets.0.reserveInvestissement",
        "budgets.0.chargesNonReconductibles",
      ]);
    });

    it("vide les détails renseignés quand l'affectation est null", () => {
      const budgets = [
        budgetWithDetails({
          affectationReservesFondsDedies: null,
          chargesNonReconductibles: null,
        }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([
        "budgets.0.reserveInvestissement",
      ]);
    });

    it("ne vide rien quand l'affectation est positive", () => {
      const budgets = [
        budgetWithDetails({ affectationReservesFondsDedies: 1000 }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([]);
    });

    it("ne vide rien quand l'affectation est négative (déficit)", () => {
      const budgets = [
        budgetWithDetails({ affectationReservesFondsDedies: -500 }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([]);
    });

    it("ne renvoie que les champs déjà nuls, donc rien à vider", () => {
      const budgets = [
        budgetWithDetails({
          affectationReservesFondsDedies: 0,
          reserveInvestissement: null,
          chargesNonReconductibles: null,
        }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([]);
    });

    it("utilise l'index du tableau pour cibler la bonne année", () => {
      const budgets = [
        budgetWithDetails({ year: 2024, affectationReservesFondsDedies: 1000 }),
        budgetWithDetails({
          year: 2023,
          affectationReservesFondsDedies: 0,
          reserveInvestissement: 300,
          chargesNonReconductibles: null,
        }),
      ];
      expect(getBudgetDetailPathsToClear(budgets)).toEqual([
        "budgets.1.reserveInvestissement",
      ]);
    });

    it("filtre par type sans décaler l'index du tableau complet", () => {
      const budgets = [
        budgetWithDetails({
          cpomStructureType: StructureType.CADA,
          affectationReservesFondsDedies: 0,
          reserveInvestissement: 50,
          chargesNonReconductibles: null,
        }),
        budgetWithDetails({
          cpomStructureType: StructureType.HUDA,
          affectationReservesFondsDedies: 0,
          reserveInvestissement: 70,
          chargesNonReconductibles: null,
        }),
      ];
      expect(getBudgetDetailPathsToClear(budgets, StructureType.HUDA)).toEqual([
        "budgets.1.reserveInvestissement",
      ]);
    });
  });
});
