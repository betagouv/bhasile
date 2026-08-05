import type { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import type { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import type { StructureType } from "@/types/structure.type";

// Chaque tranche est optionnelle : une règle n'est évaluée que si toutes celles qu'elle
// déclare dans `requires` sont présentes. Absent != vide.
export type AnomalieContext = {
  structure?: StructureContext;
  typologies?: TypologieContext[];
  actes?: ActeContext[];
  adresses?: AdresseContext[];
  budgets?: BudgetContext[];
  indicateurs?: IndicateurContext[];
  evaluations?: EvaluationContext[];
  dnas?: DnaContext[];
  cpoms?: CpomContext[];
  activites?: ActiviteContext[];
};

export type StructureContext = {
  type: StructureType | null;
  departementAdministratif: string | null;
  tarifJournalierCible: number | null; // reporting.tarif_journalier_cible, selon type et zonage IDF
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

export type TypologieContext = {
  year: number;
  placesAutorisees: number | null;
  pmr: number | null;
  lgbt: number | null;
  fvvTeh: number | null;
};

export type ActeContext = {
  id: number;
  category: ActeAdministratifCategory;
  startDate: Date | null;
  endDate: Date | null;
  isMissing: boolean | null;
  parentId: number | null;
  cpomId: number | null;
  hasFile: boolean;
};

export type AdresseContext = {
  id: number;
  placesAutorisees: number | null;
};

export type BudgetContext = {
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

export type IndicateurContext = {
  year: number;
  type: IndicateurFinancierType;
  isMissing: boolean | null;
  tauxEncadrement: number | null;
  coutJournalier: number | null;
};

export type EvaluationContext = {
  date: Date | null;
};

export type DnaContext = {
  id: number;
  code: string;
};

export type CpomContext = {
  id: number;
  structuresCount: number;
  hasConventionDocument: boolean;
};

export type ActiviteContext = {
  dnaCode: string;
  placesAutorisees: number | null;
  placesIndisponibles: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
};
