import { StatistiqueApiRead, StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import { getActiviteStatistiques } from "./activite/activite.service";
import { getControleQualiteStatistiques } from "./controle-qualite/controle-qualite.service";
import { getFinanceStatistiques } from "./finance/finance.service";
import { getPlacesStatistiques } from "./places/places.service";
import { buildStatistiquesContext } from "./shared/context";
import { getStructuresStatistiques } from "./structures/structures.service";

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiqueApiRead> => {
  // TODO: exposer meta.updatedAt par bloc (campagne actualisation, OFII, instant T)
  const context = await buildStatistiquesContext(filters);

  const [finance, controleQualite, activite, structures, places] =
    await Promise.all([
      getFinanceStatistiques(context),
      getControleQualiteStatistiques(context),
      getActiviteStatistiques(context),
      Promise.resolve(getStructuresStatistiques(context)),
      Promise.resolve(getPlacesStatistiques(context)),
    ]);

  return {
    structures,
    places,
    finance,
    controleQualite,
    activite,
  };
};
