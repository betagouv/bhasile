import type { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import type { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import type { StructureType } from "@/types/structure.type";

// Chaque tranche est optionnelle : une règle n'est évaluée que si toutes celles qu'elle
// déclare dans `requiert` sont présentes. Absent != vide.
export type AnomalieContexte = {
  structure?: StructureContexte;
  typologies?: TypologieContexte[];
  actes?: ActeContexte[];
  adresses?: AdresseContexte[];
  budgets?: BudgetContexte[];
  indicateurs?: IndicateurContexte[];
  evaluations?: EvaluationContexte[];
  dnas?: DnaContexte[];
  cpoms?: CpomContexte[];
  activites?: ActiviteContexte[];
};

export type StructureContexte = {
  type: StructureType | null;
  departementAdministratif: string | null;
  estIdf: boolean;
  creationDate: Date | null;
  date303: Date | null;
  placesAutorisees: number | null;
  lgbt: boolean | null;
  fvvTeh: boolean | null;
  debutConvention: Date | null;
  finConvention: Date | null;
  debutPeriodeAutorisation: Date | null;
  finPeriodeAutorisation: Date | null;
};

export type TypologieContexte = {
  year: number;
  placesAutorisees: number | null;
  pmr: number | null;
  lgbt: number | null;
  fvvTeh: number | null;
};

export type ActeContexte = {
  id: number;
  category: ActeAdministratifCategory;
  startDate: Date | null;
  endDate: Date | null;
  isMissing: boolean | null;
  parentId: number | null;
  cpomId: number | null;
  hasFile: boolean;
};

export type AdresseContexte = {
  id: number;
  placesAutorisees: number | null;
};

export type BudgetContexte = {
  year: number;
  isMissing: boolean | null;
  totalProduits: number | null;
  totalCharges: number | null;
  repriseEtat: number | null;
  excedentRecupere: number | null;
  excedentDeduit: number | null;
  fondsDedies: number | null;
  affectationReservesFondsDedies: number | null;
  reserveInvestissement: number | null;
  chargesNonReconductibles: number | null;
  reserveCompensationDeficits: number | null;
  reserveCompensationBFR: number | null;
  reserveCompensationAmortissements: number | null;
  reportANouveau: number | null;
  autre: number | null;
};

export type IndicateurContexte = {
  year: number;
  type: IndicateurFinancierType;
  isMissing: boolean | null;
  tauxEncadrement: number | null;
  coutJournalier: number | null;
};

export type EvaluationContexte = {
  date: Date | null;
};

export type DnaContexte = {
  id: number;
  code: string;
};

export type CpomContexte = {
  id: number;
  structuresCount: number;
  hasConventionDocument: boolean;
};

export type ActiviteContexte = {
  dnaCode: string;
  placesAutorisees: number | null;
  placesIndisponibles: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
};
