import {
  StatistiqueApiRead,
  StatistiquesFiltersRaw,
} from "@/schemas/api/statistique.schema";

import { getActiviteStatistiques } from "./activite/activite.service";
import { getControleQualiteStatistiques } from "./controle-qualite/controle-qualite.service";
import { getFinanceStatistiques } from "./finance/finance.service";
import { getPlacesStatistiques } from "./places/places.service";
import { buildStatistiquesContext } from "./shared/shared.service";
import { getStructuresStatistiques } from "./structures/structures.service";
import { parseNumericAggregation } from "./shared/shared.utils";

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiqueApiRead | null> => {
  const context = await buildStatistiquesContext(filters);
  if (!context) {
    return null;
  }

  const aggregation = parseNumericAggregation(filters.aggregation);

  const [structures, places, finance, controleQualite, activite] =
    await Promise.all([
      getStructuresStatistiques(context),
      getPlacesStatistiques(context),
      getFinanceStatistiques(context, aggregation),
      getControleQualiteStatistiques(context, aggregation),
      getActiviteStatistiques(context),
    ]);

  return {
    structures,
    places,
    finance,
    controleQualite,
    activite,
  };
};
