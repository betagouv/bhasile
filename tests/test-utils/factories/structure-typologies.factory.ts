import { getCurrentYear } from "@/app/utils/now.util";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const createStructureTypologies = (): StructureTypologieApiType[] =>
  [0, 1, 2, 3].map((delta) => ({
    id: delta + 1,
    year: getCurrentYear() - delta,
    placesAutorisees: 10,
    pmr: 0,
    lgbt: 0,
    fvvTeh: 0,
  }));
