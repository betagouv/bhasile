import { getPercentage } from "@/app/utils/common.util";
import { isYearIncomplete } from "@/app/utils/statistiques-period.util";
import {
  CompletudeStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

export const isSomeDataIncomplete = (
  statistiques: StatistiqueApiRead
): boolean => {
  const isStructuresDataIncomplete = statistiques.structures.byYear.some(
    (structureYear) => isYearIncomplete(structureYear.completude)
  );
  const isPlacesDataIncomplete = statistiques.places.byYear.some(
    (placeYear) => isYearIncomplete(placeYear.completude)
  );
  const isFinancesDataIncomplete = statistiques.finance.byYear.some(
    (financeYear) => isYearIncomplete(financeYear.total.completude)
  );

  return (
    isStructuresDataIncomplete ||
    isPlacesDataIncomplete ||
    isFinancesDataIncomplete
  );
};

export const getCompletudeChartData = (
  completudes: (CompletudeStat | null | undefined)[]
) => ({
  incompleteYears: completudes.map(isYearIncomplete),
  nbRenseignees: completudes.map((completude) => completude?.nbRenseignees ?? 0),
  percentages: completudes.map((completude) =>
    getPercentage(completude?.nbRenseignees ?? 0, completude?.nbAttendues ?? 1)
  ),
});
