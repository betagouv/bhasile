import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { structureTypologieSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

export const getStructureTypologyDefaultValues = (
  structureTypologies: StructureTypologieApiType[]
): structureTypologieSchemaTypeFormValues[] => {
  return structureTypologies.map((structureTypology) => ({
    ...structureTypology,
    year: structureTypology?.year,
    placesAutorisees: structureTypology?.placesAutorisees ?? undefined,
    pmr: structureTypology?.pmr ?? undefined,
    lgbt: structureTypology?.lgbt ?? undefined,
    fvvTeh: structureTypology?.fvvTeh ?? undefined,
    placesACreer: structureTypology?.placesACreer ?? undefined,
    placesAFermer: structureTypology?.placesAFermer ?? undefined,
    echeancePlacesACreer: structureTypology?.echeancePlacesACreer ?? undefined,
    echeancePlacesAFermer:
      structureTypology?.echeancePlacesAFermer ?? undefined,
  })) as structureTypologieSchemaTypeFormValues[];
};
