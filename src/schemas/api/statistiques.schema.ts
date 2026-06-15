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

export type StatistiquesApiType = {
  totalStructures: number;
  totalCpoms: number;
  totalPlaces: number;
  structureTypes: StructureTypeStat[];
  structureBatis: StructureBatiStat[];
};
