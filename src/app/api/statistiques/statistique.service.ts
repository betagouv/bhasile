import {
  StatistiqueApiRead,
  StatistiquesFiltersRaw,
} from "@/schemas/api/statistique.schema";

import { getActiviteStatistiques } from "./activite/activite.service";
import { getControleQualiteStatistiques } from "./controle-qualite/controle-qualite.service";
import { getFinanceStatistiques } from "./finance/finance.service";
import { parseNumericAggregation } from "./shared/aggregation";
import { getPlacesStatistiques } from "./places/places.service";
import { buildStatistiquesContext } from "./shared/context";
import { getStructuresStatistiques } from "./structures/structures.service";

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiqueApiRead> => {
  // TODO: exposer meta.updatedAt par bloc (campagne actualisation, OFII, instant T)
  // TODO: add RMU
  const context = await buildStatistiquesContext(filters);
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
