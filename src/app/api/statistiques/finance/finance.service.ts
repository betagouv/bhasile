import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/shared.service";
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
  aggregation: StatistiqueApiRead["finance"]["aggregation"]
): Promise<StatistiqueApiRead["finance"]> => {
  const { structures } = context;
  const scopeIds = getStructureIdsByFinanceScope(structures);

  const [budgetsTotal, budgetsAutorisees, budgetsSubventionnees, indicateurs] =
    await Promise.all([
      findBudgets(scopeIds.total),
      findBudgets(scopeIds.autorisees),
      findBudgets(scopeIds.subventionnees),
      findIndicateursFinanciers(scopeIds.total),
    ]);

  return computeFinanceStatistiques(
    scopeIds,
    {
      total: budgetsTotal,
      autorisees: budgetsAutorisees,
      subventionnees: budgetsSubventionnees,
    },
    indicateurs,
    aggregation
  );
};
