// TODO: refactor with real API schema
type StructureTypeStat = {
  label: string;
  byYear: ByYear[];
};

type StructureBatiStat = {
  label: string;
  byYear: ByYear[];
};

type ByYear = {
  year: number;
  nbStructures: number;
  nbCpoms: number;
  nbPlaces: number;
};

type ByYearTypePlaces = {
  year: number;
  nbPlaces: number;
};

type TypesPlaces = {
  label: string;
  subLabel?: string;
  byYear: ByYearTypePlaces[];
};

export type StatistiquesApiType = {
  totalStructures: number;
  totalCpoms: number;
  totalPlaces: number;
  tauxEquipement: number;
  structuresAvecCpom: number;
  placesAutorisees: number;
  placesPmr: number;
  placesLgbt: number;
  placesFvvTeh: number;
  placesQPV: number;
  placesLogementsSociaux: number;
  typesPlaces: TypesPlaces[];
  structureTypes: StructureTypeStat[];
  structureBatis: StructureBatiStat[];
};
