import { getDepartementActivitesAverage } from "./activite.repository";
import { ActiviteStats } from "./activite.type";

export const getAverageDepartementPlaces = async (
  departement: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<ActiviteStats | null> => {
  return getDepartementActivitesAverage(departement, startDate, endDate);
};
