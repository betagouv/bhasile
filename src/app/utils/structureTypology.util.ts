import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { structureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

import { getTypePlacesYearRange } from "./date.util";

export const getStructureTypologyDefaultValues = (
  structureTypologies: StructureTypologieApiType[],
  structureCreationYear: number
): structureTypologieSchemaTypeFormValues[] => {
  const { years } = getTypePlacesYearRange();
  const yearsToDisplay = years.filter((year) => year >= structureCreationYear);

  return Array(yearsToDisplay.length)
    .fill({})
    .map((_, index) => ({
      year: yearsToDisplay[index],
    }))
    .map((emptyBudget) => {
      const structureTypology = structureTypologies.find(
        (budget) => budget.year === emptyBudget.year
      );
      if (structureTypology) {
        return {
          ...structureTypology,
          year: structureTypology.year,
          placesAutorisees: structureTypology.placesAutorisees ?? undefined,
          pmr: structureTypology.pmr ?? undefined,
          lgbt: structureTypology.lgbt ?? undefined,
          fvvTeh: structureTypology.fvvTeh ?? undefined,
          placesACreer: structureTypology.placesACreer ?? undefined,
          placesAFermer: structureTypology.placesAFermer ?? undefined,
          echeancePlacesACreer:
            structureTypology.echeancePlacesACreer ?? undefined,
          echeancePlacesAFermer:
            structureTypology.echeancePlacesAFermer ?? undefined,
        };
      }
      return emptyBudget;
    }) as structureTypologieSchemaTypeFormValues[];
};
