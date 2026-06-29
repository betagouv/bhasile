import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import { findActivites } from "./activite.repository";
import { computeActiviteStatistiques } from "./activite.util";

export const getActiviteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["activite"]> => {
  const { allStructures, dnaLinks, dnaCodes } = context;
  const activites = await findActivites(dnaCodes);

  return computeActiviteStatistiques(activites, dnaLinks, allStructures);
};
