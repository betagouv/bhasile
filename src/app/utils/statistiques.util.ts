import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

export const isSomeDataIncomplete = (
  statistiques: StatistiqueApiRead
): boolean => {
  const isStructuresDataIncomplete = statistiques.structures.byYear.some(
    (structureYear) => !structureYear.completude?.isComplete
  );
  const isPlacesDataIncomplete = statistiques.places.byYear.some(
    (placeYear) => !placeYear.completude?.isComplete
  );
  const isFinancesDataIncomplete = statistiques.finance.byYear.some(
    (financeYear) => !financeYear.total.completude?.isComplete
  );

  return (
    isStructuresDataIncomplete ||
    isPlacesDataIncomplete ||
    isFinancesDataIncomplete
  );
};
