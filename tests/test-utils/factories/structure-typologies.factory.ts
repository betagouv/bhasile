import { CURRENT_YEAR } from "@/constants";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const createStructureTypologies = (): StructureTypologieApiType[] =>
  [0, 1, 2, 3].map((delta) => ({
    id: delta + 1,
    year: CURRENT_YEAR - delta,
    placesAutorisees: 10,
    pmr: 0,
    lgbt: 0,
    fvvTeh: 0,
    placesACreer: 0,
    placesAFermer: 0,
    echeancePlacesACreer: undefined,
    echeancePlacesAFermer: undefined,
  }));
