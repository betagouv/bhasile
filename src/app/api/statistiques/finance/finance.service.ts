import {
  StatistiqueApiRead,
  type StatistiquesAggregation,
} from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import {
  findBudgets,
  findIndicateursFinanciers,
} from "./finance.repository";
import {
  computeFinanceStatistiques,
  getStructureIdsByFinanceScope,
} from "./finance.util";

export const getFinanceStatistiques = async (
  context: StatistiquesContext,
  aggregation: StatistiquesAggregation
): Promise<StatistiqueApiRead["finance"]> => {
  const { allStructures, yearContext } = context;
  const scopeIds = getStructureIdsByFinanceScope(allStructures);

  const [budgetsTotal, budgetsAutorisees, budgetsSubventionnees, indicateurs] =
    await Promise.all([
      findBudgets(scopeIds.total),
      findBudgets(scopeIds.autorisees),
      findBudgets(scopeIds.subventionnees),
      findIndicateursFinanciers(scopeIds.total),
    ]);

  return computeFinanceStatistiques(
    scopeIds,
    yearContext,
    {
      total: budgetsTotal,
      autorisees: budgetsAutorisees,
      subventionnees: budgetsSubventionnees,
    },
    indicateurs,
    aggregation
  );
};
