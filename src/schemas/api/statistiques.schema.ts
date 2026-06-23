import { BudgetApiType } from "./budget.schema";

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

type Finance = {
  byYear: FinanceByYear[];
};

type FinanceByYear = {
  year: number;
  total: FinanceItem;
  autorisees: FinanceItem;
  subventionnees: FinanceItem;
};

type FinanceItem = {
  dotationDemandee: number;
  dotationAccordee: number;
  totalETP: number;
  tauxEncadrement: number | null;
  coutJournalier: number | null;
  totalProduits: number;
  totalCharges: number;
  resultatNet: number;
  excedentCumule: number;
  deficitCumule: number;
  soldeCumule: number;
};

export type StatistiquesApiType = {
  totalStructures: number;
  totalCpoms: number;
  totalPlaces: number;
  tauxEquipement: number;
  structuresAvecCpom: number;
  placesAutorisees: number;
  dotationAnnuelle: number;
  dotationAutorisees: number;
  dotationSubventionnees: number;
  ETP: number;
  ETPAutorisees: number;
  ETPSubventionnees: number;
  tauxEncadrement: number;
  tauxEncadrementAutorisees: number;
  tauxEncadrementSubventionnees: number;
  coutJournalier: number;
  coutJournalierAutorisees: number;
  coutJournalierSubventionnees: number;
  budgets: (BudgetApiType & {
    excedentCumule: number;
    deficitCumule: number;
    soldeCumule: number;
  })[];
  placesPmr: number;
  placesLgbt: number;
  placesFvvTeh: number;
  placesQPV: number;
  placesLogementsSociaux: number;
  typesPlaces: TypesPlaces[];
  structureTypes: StructureTypeStat[];
  structureBatis: StructureBatiStat[];
  finance: Finance;
};
