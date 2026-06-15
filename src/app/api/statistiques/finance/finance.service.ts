import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import {
  findBudgetsByYear,
  findGlobalMedianIndicateurs,
  findGlobalMedianIndicateursByType,
  findIndicateursFinanciers,
  findYearlyMedianIndicateurs,
  findYearlyMedianIndicateursByType,
} from "./finance.repository";
import {
  buildFinanceScopeStatistiques,
  computeFinanceByYearForScope,
  getStructureIdsByFinanceScope,
} from "./finance.util";

export const getFinanceStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["finance"]> => {
  const { structures } = context;
  const scopeIds = getStructureIdsByFinanceScope(structures);

  const [
    budgetsTotal,
    budgetsAutorisees,
    budgetsSubventionnees,
    indicateurs,
    mediansTotal,
    mediansAutorisees,
    mediansSubventionnees,
    globalMedianTotal,
    globalMedianAutorisees,
    globalMedianSubventionnees,
    globalMediansByTypeTotal,
    globalMediansByTypeAutorisees,
    globalMediansByTypeSubventionnees,
    mediansByYearAndTypeTotal,
    mediansByYearAndTypeAutorisees,
    mediansByYearAndTypeSubventionnees,
  ] = await Promise.all([
    findBudgetsByYear(scopeIds.total),
    findBudgetsByYear(scopeIds.autorisees),
    findBudgetsByYear(scopeIds.subventionnees),
    findIndicateursFinanciers(scopeIds.total),
    findYearlyMedianIndicateurs(scopeIds.total),
    findYearlyMedianIndicateurs(scopeIds.autorisees),
    findYearlyMedianIndicateurs(scopeIds.subventionnees),
    findGlobalMedianIndicateurs(scopeIds.total),
    findGlobalMedianIndicateurs(scopeIds.autorisees),
    findGlobalMedianIndicateurs(scopeIds.subventionnees),
    findGlobalMedianIndicateursByType(scopeIds.total),
    findGlobalMedianIndicateursByType(scopeIds.autorisees),
    findGlobalMedianIndicateursByType(scopeIds.subventionnees),
    findYearlyMedianIndicateursByType(scopeIds.total),
    findYearlyMedianIndicateursByType(scopeIds.autorisees),
    findYearlyMedianIndicateursByType(scopeIds.subventionnees),
  ]);

  return buildFinanceScopeStatistiques(
    {
      total: computeFinanceByYearForScope(
        scopeIds.total,
        budgetsTotal,
        indicateurs,
        mediansTotal,
        mediansByYearAndTypeTotal
      ),
      autorisees: computeFinanceByYearForScope(
        scopeIds.autorisees,
        budgetsAutorisees,
        indicateurs,
        mediansAutorisees,
        mediansByYearAndTypeAutorisees
      ),
      subventionnees: computeFinanceByYearForScope(
        scopeIds.subventionnees,
        budgetsSubventionnees,
        indicateurs,
        mediansSubventionnees,
        mediansByYearAndTypeSubventionnees
      ),
    },
    {
      total: globalMedianTotal,
      autorisees: globalMedianAutorisees,
      subventionnees: globalMedianSubventionnees,
    },
    {
      total: globalMediansByTypeTotal,
      autorisees: globalMediansByTypeAutorisees,
      subventionnees: globalMediansByTypeSubventionnees,
    }
  );
};
