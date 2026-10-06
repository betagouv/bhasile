import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { StructureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

import { getTypePlacesYearRange } from "./date.util";

export const getStructureTypologyDefaultValues = (
  structureTypologies: StructureTypologieApiType[],
  structureCreationYear: number
): StructureTypologieSchemaTypeFormValues[] => {
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
        };
      }
      return emptyBudget;
    }) as StructureTypologieSchemaTypeFormValues[];
};
