import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import { findActivites } from "./activite.repository";
import {
  buildDnaEligibilityByActiviteScope,
  computeActiviteStatistiques,
} from "./activite.util";

export const getActiviteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["activite"]> => {
  const { structures, dnaLinks, dnaCodes } = context;

  const eligibility = buildDnaEligibilityByActiviteScope(dnaLinks, structures);
  const activites = await findActivites(dnaCodes);

  return computeActiviteStatistiques(activites, eligibility);
};
