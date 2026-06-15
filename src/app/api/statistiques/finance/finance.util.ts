import { StructureType } from "@/generated/prisma/client";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import {
  FinanceMedianByType,
  FinanceScopeStat,
  FinanceScopeStatByYear,
  FinanceStat,
  FinanceStatByYear,
} from "@/schemas/api/statistique.schema";
import { STRUCTURE_TYPES_DISPLAY_ORDER } from "@/types/structure.type";

import type {
  StatistiqueDbBudgetAgg,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbIndicateurMedian,
  StatistiqueDbIndicateurMedianByType,
  StatistiqueDbIndicateurMedianByYearAndType,
  StatistiqueDbIndicateurMedianGlobal,
  StatistiqueDbStructure,
} from "../shared/db.type";

const ALL_FINANCE_TYPES = STRUCTURE_TYPES_DISPLAY_ORDER as StructureType[];

const buildMediansByType = (
  rows: StatistiqueDbIndicateurMedianByType[],
  types: StructureType[] = ALL_FINANCE_TYPES
): FinanceMedianByType[] =>
  types.map((type) => {
    const row = rows.find((entry) => entry.type === type);
    return {
      type,
      tauxEncadrementMedian: row?.tauxEncadrementMedian ?? null,
      coutJournalierMedian: row?.coutJournalierMedian ?? null,
    };
  });

const emptyFinanceStat = (): FinanceStat => ({
  totalDotationsDemandees: 0,
  totalDotationsAccordees: 0,
  totalETP: 0,
  tauxEncadrementMedian: null,
  coutJournalierMedian: null,
  byType: buildMediansByType([]),
  totalProduits: 0,
  totalCharges: 0,
  excedents: 0,
  deficits: 0,
  resultatNet: 0,
});

export const getStructureIdsByFinanceScope = (
  structures: StatistiqueDbStructure[]
): { total: number[]; autorisees: number[]; subventionnees: number[] } => {
  const total: number[] = [];
  const autorisees: number[] = [];
  const subventionnees: number[] = [];

  for (const structure of structures) {
    total.push(structure.id);
    if (isStructureAutorisee(structure.type)) {
      autorisees.push(structure.id);
    }
    if (isStructureSubventionnee(structure.type)) {
      subventionnees.push(structure.id);
    }
  }

  return { total, autorisees, subventionnees };
};

export const computeFinanceByYearForScope = (
  structureIds: number[],
  budgets: StatistiqueDbBudgetAgg[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  medians: StatistiqueDbIndicateurMedian[],
  mediansByType: StatistiqueDbIndicateurMedianByYearAndType[]
): FinanceStatByYear[] => {
  const idSet = new Set(structureIds);
  const scopedBudgets = budgets;
  const scopedIndicateurs = indicateurs.filter(
    (indicateur) =>
      indicateur.structureId !== null && idSet.has(indicateur.structureId)
  );

  const years = [
    ...new Set([
      ...scopedBudgets.map((budget) => budget.year),
      ...scopedIndicateurs.map((indicateur) => indicateur.year),
    ]),
  ].sort((yearA, yearB) => yearA - yearB);

  return years.map((year) => {
    const budget = scopedBudgets.find((entry) => entry.year === year);
    const indicsForYear = scopedIndicateurs.filter(
      (indicateur) => indicateur.year === year
    );
    const median = medians.find((entry) => entry.year === year);

    const totalETP = indicsForYear.reduce(
      (acc, indicateur) => acc + (indicateur.ETP ?? 0),
      0
    );
    const totalProduits = budget?.totalProduits ?? 0;
    const totalCharges = budget?.totalCharges ?? 0;
    const resultatNet = totalProduits - totalCharges;

    return {
      year,
      totalDotationsDemandees: budget?.dotationDemandee ?? 0,
      totalDotationsAccordees: budget?.dotationAccordee ?? 0,
      totalETP,
      tauxEncadrementMedian: median?.tauxEncadrementMedian ?? null,
      coutJournalierMedian: median?.coutJournalierMedian ?? null,
      byType: buildMediansByType(
        mediansByType.filter((entry) => entry.year === year)
      ),
      totalProduits,
      totalCharges,
      excedents: resultatNet > 0 ? resultatNet : 0,
      deficits: resultatNet < 0 ? Math.abs(resultatNet) : 0,
      resultatNet,
    };
  });
};

const financeStatFromYear = (yearStat: FinanceStatByYear): FinanceStat => {
  const { year: _year, ...stat } = yearStat;
  return stat;
};

const pickLatestFinanceStat = (
  byYear: FinanceStatByYear[],
  globalMedian: StatistiqueDbIndicateurMedianGlobal,
  globalMediansByType: StatistiqueDbIndicateurMedianByType[]
): FinanceStat => {
  if (byYear.length === 0) {
    return {
      ...emptyFinanceStat(),
      tauxEncadrementMedian: globalMedian.tauxEncadrementMedian,
      coutJournalierMedian: globalMedian.coutJournalierMedian,
      byType: buildMediansByType(globalMediansByType),
    };
  }

  const latest = byYear[byYear.length - 1];
  return {
    ...financeStatFromYear(latest),
    tauxEncadrementMedian:
      latest.tauxEncadrementMedian ?? globalMedian.tauxEncadrementMedian,
    coutJournalierMedian:
      latest.coutJournalierMedian ?? globalMedian.coutJournalierMedian,
    byType: latest.byType,
  };
};

export const buildFinanceScopeStat = (
  byYear: FinanceStatByYear[],
  globalMedian: StatistiqueDbIndicateurMedianGlobal,
  globalMediansByType: StatistiqueDbIndicateurMedianByType[]
): FinanceStat =>
  pickLatestFinanceStat(byYear, globalMedian, globalMediansByType);

export const buildFinanceScopeStatistiques = (
  scopes: {
    total: FinanceStatByYear[];
    autorisees: FinanceStatByYear[];
    subventionnees: FinanceStatByYear[];
  },
  medians: {
    total: StatistiqueDbIndicateurMedianGlobal;
    autorisees: StatistiqueDbIndicateurMedianGlobal;
    subventionnees: StatistiqueDbIndicateurMedianGlobal;
  },
  mediansByType: {
    total: StatistiqueDbIndicateurMedianByType[];
    autorisees: StatistiqueDbIndicateurMedianByType[];
    subventionnees: StatistiqueDbIndicateurMedianByType[];
  }
): { summary: FinanceScopeStat; byYear: FinanceScopeStatByYear[] } => {
  const years = [
    ...new Set([
      ...scopes.total.map((entry) => entry.year),
      ...scopes.autorisees.map((entry) => entry.year),
      ...scopes.subventionnees.map((entry) => entry.year),
    ]),
  ].sort((yearA, yearB) => yearA - yearB);

  const byYear: FinanceScopeStatByYear[] = years.map((year) => ({
    year,
    total:
      scopes.total.find((entry) => entry.year === year) ??
      ({ year, ...emptyFinanceStat() } as FinanceStatByYear),
    autorisees:
      scopes.autorisees.find((entry) => entry.year === year) ??
      ({ year, ...emptyFinanceStat() } as FinanceStatByYear),
    subventionnees:
      scopes.subventionnees.find((entry) => entry.year === year) ??
      ({ year, ...emptyFinanceStat() } as FinanceStatByYear),
  }));

  return {
    summary: {
      total: buildFinanceScopeStat(
        scopes.total,
        medians.total,
        mediansByType.total
      ),
      autorisees: buildFinanceScopeStat(
        scopes.autorisees,
        medians.autorisees,
        mediansByType.autorisees
      ),
      subventionnees: buildFinanceScopeStat(
        scopes.subventionnees,
        medians.subventionnees,
        mediansByType.subventionnees
      ),
    },
    byYear,
  };
};
