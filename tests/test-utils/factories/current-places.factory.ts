import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const createCurrentPlaces = (
  structureTypologies?: StructureTypologieApiType[]
) => ({
  placesAutorisees: structureTypologies?.[0]?.placesAutorisees ?? 0,
  qpv: 0,
  logementsSociaux: 0,
});
