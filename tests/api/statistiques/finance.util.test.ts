import { describe, expect, it } from "vitest";

import { computeFinanceStatistiques } from "@/app/api/statistiques/finance/finance.util";
import type { StatistiqueDbBudget } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestStatistiquesContext,
} from "./test-helpers";

const budgetRow = (
  id: number,
  structureId: number,
  year: number,
  totalProduits: number,
  totalCharges: number
): StatistiqueDbBudget => ({
  id,
  structureId,
  year,
  dotationDemandee: 0,
  dotationAccordee: 0,
  totalProduits,
  totalCharges,
});

describe("finance statistics util", () => {
  const structures = [
    { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
    { id: 2, type: StructureType.CAES, departementAdministratif: "75" },
  ];

  const buildFinanceContext = (
    budgets: StatistiqueDbBudget[],
    indicateurs = buildTestStatistiquesContext({
      structures,
      typologies: [],
      adresses: [],
      departements: [],
    }).indicateurs
  ) =>
    buildTestStatistiquesContext({
      structures,
      typologies: [],
      adresses: [],
      departements: [],
      budgets,
      indicateurs,
      activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
        structures.map((structure) => structure.id),
        { financeYears: [...new Set(budgets.map((budget) => budget.year))] }
      ),
    });

  it("should split excess and deficit per structure before cumulating", () => {
    const budgets = [
      budgetRow(1, 1, 2023, 200, 100),
      budgetRow(2, 2, 2023, 50, 90),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext(budgets),
      "moyenne"
    );

    const year2023 = result.byYear.find((entry) => entry.year === 2023);

    expect(year2023?.total.resultatNet).toBe(60);
    expect(year2023?.total.excedentCumule).toBe(100);
    expect(year2023?.total.deficitCumule).toBe(40);
    expect(year2023?.total.soldeCumule).toBe(60);
    expect(year2023?.autorisees.excedentCumule).toBe(100);
    expect(year2023?.autorisees.deficitCumule).toBe(0);
    expect(year2023?.subventionnees.excedentCumule).toBe(0);
    expect(year2023?.subventionnees.deficitCumule).toBe(40);
  });

  it("should cumulate excess and deficit across years", () => {
    const budgets = [
      budgetRow(1, 1, 2023, 150, 100),
      budgetRow(2, 1, 2024, 80, 110),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext(budgets),
      "moyenne"
    );

    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.excedentCumule).toBe(50);
    expect(year2024?.total.deficitCumule).toBe(30);
    expect(year2024?.total.soldeCumule).toBe(20);
  });

  it("should not infer subventionnee budgets from a previous year", () => {
    const budgets = [
      budgetRow(1, 1, 2024, 100, 80),
      budgetRow(2, 2, 2024, 60, 90),
      budgetRow(3, 1, 2025, 0, 0),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext(budgets),
      "moyenne"
    );

    const year2025 = result.byYear.find((entry) => entry.year === 2025);

    expect(year2025?.subventionnees.totalProduits).toBe(0);
    expect(year2025?.subventionnees.totalCharges).toBe(0);
    expect(year2025?.subventionnees.resultatNet).toBe(0);
    expect(year2025?.subventionnees.excedentCumule).toBe(0);
    expect(year2025?.subventionnees.deficitCumule).toBe(0);
    expect(year2025?.subventionnees.soldeCumule).toBe(0);
  });

  it("should prefer REALISE over PREVISIONNEL per field", () => {
    const budgets = [budgetRow(1, 1, 2024, 0, 0)];
    const indicateurs = [
      {
        id: 1,
        structureId: 1,
        year: 2024,
        type: "REALISE" as const,
        ETP: 10,
        tauxEncadrement: null,
        coutJournalier: 50,
      },
      {
        id: 2,
        structureId: 1,
        year: 2024,
        type: "PREVISIONNEL" as const,
        ETP: 99,
        tauxEncadrement: 0.8,
        coutJournalier: 99,
      },
      {
        id: 3,
        structureId: 2,
        year: 2024,
        type: "PREVISIONNEL" as const,
        ETP: 5,
        tauxEncadrement: 0.5,
        coutJournalier: 40,
      },
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext(budgets, indicateurs),
      "moyenne"
    );

    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    // Only structures having a Budget for the year are included in the scope.
    expect(year2024?.total.totalETP).toBe(10);
    expect(year2024?.total.tauxEncadrement).toBe(0.8);
    expect(year2024?.total.coutJournalier).toBe(50);
  });
});
