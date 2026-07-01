import { describe, expect, it } from "vitest";

import { computeFinanceStatistiques } from "@/app/api/statistiques/finance/finance.util";
import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
} from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestStatistiquesContext,
} from "./test-helpers";

const testStructure = (
  id: number,
  type: StructureType,
  departementAdministratif = "75"
): StatistiqueDbStructure => ({
  id,
  type,
  departementAdministratif,
});

const budgetRow = (
  id: number,
  structureId: number,
  year: number,
  totalProduits: number,
  totalCharges: number,
  overrides: Partial<
    Pick<StatistiqueDbBudget, "dotationDemandee" | "dotationAccordee">
  > = {}
): StatistiqueDbBudget => ({
  id,
  structureId,
  year,
  dotationDemandee: overrides.dotationDemandee ?? 0,
  dotationAccordee: overrides.dotationAccordee ?? 0,
  totalProduits,
  totalCharges,
});

const indicateurRow = (
  id: number,
  structureId: number,
  year: number,
  type: "REALISE" | "PREVISIONNEL",
  overrides: Partial<
    Pick<
      StatistiqueDbIndicateurFinancier,
      "ETP" | "tauxEncadrement" | "coutJournalier"
    >
  > = {}
): StatistiqueDbIndicateurFinancier => ({
  id,
  structureId,
  year,
  type,
  ETP: overrides.ETP ?? null,
  tauxEncadrement: overrides.tauxEncadrement ?? null,
  coutJournalier: overrides.coutJournalier ?? null,
});

const buildFinanceContext = (args: {
  structures: StatistiqueDbStructure[];
  budgets?: StatistiqueDbBudget[];
  indicateurs?: StatistiqueDbIndicateurFinancier[];
}) => {
  const budgets = args.budgets ?? [];
  const indicateurs = args.indicateurs ?? [];
  const years = [
    ...new Set([
      ...budgets.map((budget) => budget.year),
      ...indicateurs.map((indicateur) => indicateur.year),
    ]),
  ];

  return buildTestStatistiquesContext({
    structures: args.structures,
    allStructures: args.structures,
    typologies: [],
    adresses: [],
    departements: [],
    budgets,
    indicateurs,
    activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
      args.structures.map((structure) => structure.id),
      { financeYears: years }
    ),
  });
};

describe("finance — périmètres autorisées / subventionnées / total", () => {
  it("répartit les budgets et les résultats nets sur les trois scopes", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.CPH),
      testStructure(3, StructureType.HUDA),
      testStructure(4, StructureType.CAES),
    ];

    const budgets = [
      budgetRow(1, 1, 2024, 200, 100), // +100 (autorisee)
      budgetRow(2, 2, 2024, 90, 110), // -20 (autorisee)
      budgetRow(3, 3, 2024, 50, 90), // -40 (subventionnee)
      budgetRow(4, 4, 2024, 70, 60), // +10 (subventionnee)
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, budgets }),
      "moyenne"
    );
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.resultatNet).toBe(50);
    expect(year2024?.total.excedentCumule).toBe(110);
    expect(year2024?.total.deficitCumule).toBe(60);

    expect(year2024?.autorisees.resultatNet).toBe(80);
    expect(year2024?.autorisees.excedentCumule).toBe(100);
    expect(year2024?.autorisees.deficitCumule).toBe(20);

    expect(year2024?.subventionnees.resultatNet).toBe(-30);
    expect(year2024?.subventionnees.excedentCumule).toBe(10);
    expect(year2024?.subventionnees.deficitCumule).toBe(40);
  });

  it("n'infère pas de budgets sur une année absente du scope (zéros)", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.HUDA),
    ];

    const budgets = [
      budgetRow(1, 1, 2024, 100, 80), // autorisee
      budgetRow(2, 2, 2024, 60, 90), // subventionnee
      budgetRow(3, 1, 2025, 0, 0), // uniquement autorisee en 2025
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, budgets }),
      "moyenne"
    );
    const year2025 = result.byYear.find((entry) => entry.year === 2025);

    expect(year2025?.subventionnees.totalProduits).toBe(0);
    expect(year2025?.subventionnees.totalCharges).toBe(0);
    expect(year2025?.subventionnees.resultatNet).toBe(0);
    expect(year2025?.subventionnees.excedentCumule).toBe(0);
    expect(year2025?.subventionnees.deficitCumule).toBe(0);
  });
});

describe("finance — fallback réalisé vers prévisionnel", () => {
  it("prend le réalisé si présent, sinon repli prévisionnel, champ par champ", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.CAES),
    ];

    const indicateurs = [
      indicateurRow(1, 1, 2024, "REALISE", {
        ETP: 10,
        tauxEncadrement: null,
        coutJournalier: 50,
      }),
      indicateurRow(2, 1, 2024, "PREVISIONNEL", {
        ETP: 99,
        tauxEncadrement: 0.8,
        coutJournalier: 99,
      }),
      indicateurRow(3, 2, 2024, "PREVISIONNEL", {
        ETP: 5,
        tauxEncadrement: 0.5,
        coutJournalier: 40,
      }),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, indicateurs }),
      "moyenne"
    );
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.totalETP).toBe(15);
    expect(year2024?.total.tauxEncadrement).toBe(0.7);
    expect(year2024?.total.coutJournalier).toBe(45);
  });
});

describe("finance — moyenne et médiane", () => {
  it("applique moyenne ou médiane sur taux et coût (après résolution réalisé/prévisionnel)", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.CPH),
      testStructure(3, StructureType.HUDA),
    ];

    const indicateurs = [
      indicateurRow(1, 1, 2024, "PREVISIONNEL", {
        tauxEncadrement: 0.1,
        coutJournalier: 10,
      }),
      indicateurRow(2, 2, 2024, "PREVISIONNEL", {
        tauxEncadrement: 0.2,
        coutJournalier: 20,
      }),
      indicateurRow(3, 3, 2024, "PREVISIONNEL", {
        tauxEncadrement: 0.9,
        coutJournalier: 100,
      }),
    ];

    const mean = computeFinanceStatistiques(
      buildFinanceContext({ structures, indicateurs }),
      "moyenne"
    );
    const median = computeFinanceStatistiques(
      buildFinanceContext({ structures, indicateurs }),
      "mediane"
    );

    const mean2024 = mean.byYear.find((entry) => entry.year === 2024);
    const median2024 = median.byYear.find((entry) => entry.year === 2024);

    expect(mean2024?.total.tauxEncadrement).toBe(0.4);
    expect(median2024?.total.tauxEncadrement).toBe(0.2);

    expect(mean2024?.total.coutJournalier).toBe(43.3);
    expect(median2024?.total.coutJournalier).toBe(20);
  });
});
