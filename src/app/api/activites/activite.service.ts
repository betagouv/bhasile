import { getDepartmentActivitesAverage } from "./activite.repository";
import { ActiviteStats } from "./activite.type";

export const getAverageDepartementPlaces = async (
  departement: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<ActiviteStats | null> => {
  return getDepartmentActivitesAverage(departement, startDate, endDate);
};
