import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import { findActivites, findLatestActivites } from "./activite.repository";
import { computeActiviteStat } from "./activite.util";

export const getActiviteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["activite"]> => {
  const { dnaCodes } = context;

  const [latestActivites, activitesTimeSeries] = await Promise.all([
    findLatestActivites(dnaCodes),
    findActivites(dnaCodes),
  ]);

  return computeActiviteStat(latestActivites, activitesTimeSeries);
};
