import { StatistiqueApiRead, StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import {
  emptyActiviteStatistiques,
  getActiviteStatistiques,
} from "./activite/activite.service";
import {
  emptyControleQualiteStatistiques,
  getControleQualiteStatistiques,
} from "./controle-qualite/controle-qualite.service";
import {
  emptyFinanceStatistiques,
  getFinanceStatistiques,
} from "./finance/finance.service";
import {
  emptyPlacesStatistiques,
  getPlacesStatistiques,
} from "./places/places.service";
import { buildStatistiquesContext } from "./shared/context";
import {
  emptyStructuresStatistiques,
  getStructuresStatistiques,
} from "./structures/structures.service";

export const getStatistiques = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiqueApiRead> => {
  // TODO: exposer meta.updatedAt par bloc (campagne actualisation, OFII, instant T)
  const context = await buildStatistiquesContext(filters);

  if (!context) {
    return emptyResult();
  }

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

const emptyResult = (): StatistiqueApiRead => ({
  structures: emptyStructuresStatistiques(),
  places: emptyPlacesStatistiques(),
  finance: emptyFinanceStatistiques(),
  controleQualite: emptyControleQualiteStatistiques(),
  activite: emptyActiviteStatistiques(),
});
