import { findAllStructures } from "../structures/structure.repository";
import { findActivitesByDnaCodesAndDate } from "./activite.repository";
import { ActiviteStats } from "./activite.type";
import {
  collectCurrentDnaCodesInDepartement,
  computeDepartementAverage,
} from "./activite.util";

export const getAverageDepartementPlaces = async (
  departement: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<ActiviteStats | null> => {
  if (!departement || !startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const now = new Date();
  const structures = await findAllStructures();
  const dnaCodes = collectCurrentDnaCodesInDepartement(
    structures,
    departement,
    now
  );
  if (dnaCodes.length === 0) {
    return null;
  }

  const activites = await findActivitesByDnaCodesAndDate(dnaCodes, start, end);
  return computeDepartementAverage(activites, departement);
};
