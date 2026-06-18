import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/shared.service";
import { findActivites } from "./activite.repository";
import { computeActiviteStatistiques } from "./activite.util";

export const getActiviteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["activite"]> => {
  const { structures, dnaLinks, dnaCodes } = context;
  const activites = await findActivites(dnaCodes);

  return computeActiviteStatistiques(activites, dnaLinks, structures);
};
