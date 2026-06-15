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

export const emptyActiviteStatistiques = (): StatistiqueApiRead["activite"] => ({
  placesEnregistreesDna: 0,
  placesDisponibles: 0,
  placesIndisponibles: 0,
  motifsIndisponibilite: {
    desinsectisation: 0,
    remiseEnEtat: 0,
    sousOccupation: 0,
    travaux: 0,
  },
  presencesInduesByMonth: [],
});
