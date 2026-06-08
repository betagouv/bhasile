import { Repartition, StructureType } from "@/generated/prisma/client";

// Filtres passés en query params à GET /api/statistiques
export type StatistiquesFiltersRaw = {
  /** Numéros de départements séparés par virgule */
  departements: string | null;
  /** IDs de régions séparés par virgule */
  regions: string | null;
  /** IDs d'opérateurs séparés par virgule — les filiales sont incluses automatiquement */
  operateurs: string | null;
  /** Types de structures séparés par virgule (CADA, HUDA, …) */
  types: string | null;
};

export type TypeStructureStat = {
  type: StructureType | null;
  nbStructures: number;
  placesAutorisees: number;
};

export type BatiStat = {
  bati: Repartition;
  nbStructures: number;
  placesAutorisees: number;
};

export type PlacesSpecialesStat = {
  placesAutorisees: number;
  pmr: number;
  lgbt: number;
  fvvTeh: number;
  logementsSociaux: number;
};

export type YearStat = {
  year: number;
  byType: TypeStructureStat[];
  byBati: BatiStat[];
  placesSpeciales: PlacesSpecialesStat;
};

export type FinanceStatByYear = {
  year: number;
  totalDotationsDemandees: number;
  totalDotationsAccordees: number;
  totalETP: number;
  // TODO: vérifier selon hypothèses cible (REALISE vs PREVISIONNEL, périmètre CPOM)
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
  totalProduits: number;
  totalCharges: number;
  excedents: number;
  deficits: number;
  resultatNet: number;
};

export type FinanceStat = Omit<FinanceStatByYear, "year">;

export type EvaluationStat = {
  year?: number;
  nbEvaluations: number;
  moyenneGenerale: number | null;
  moyennePersonne: number | null;
  moyennePro: number | null;
  moyenneStructure: number | null;
};

export type MotifIndisponibilite = {
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

export type PresencesInduesMois = {
  date: Date;
  presencesInduesBPI: number;
  presencesInduesDeboutees: number;
};

export type ActiviteStat = {
  /** Nombre de places enregistrées dans DNA (dernier millésime mensuel) */
  placesEnregistreesDna: number;
  placesDisponibles: number;
  placesIndisponibles: number;
  motifsIndisponibilite: MotifIndisponibilite;
  presencesInduesTotalBPI: number;
  presencesInduesTotalDeboutees: number;
  /** Suivi des présences indues mois par mois */
  suivi: PresencesInduesMois[];
};

export type TauxEquipementDept = {
  departement: string;
  nom: string;
  placesAutorisees: number;
  population: number | null;
  tauxPour1000: number | null;
};

export type StatistiquesApiRead = {
  nbStructures: number;
  nbCpoms: number;
  byType: TypeStructureStat[];
  byBati: BatiStat[];
  byYear: YearStat[];
  tauxEquipement: TauxEquipementDept[];
  placesSpeciales: PlacesSpecialesStat;
  finance: FinanceStat;
  financeByYear: FinanceStatByYear[];
  eigPour1000PlacesSur12Mois: number | null;
  tauxEigComportementViolent: number | null;
  evaluations2026: EvaluationStat;
  evaluationsByYear: EvaluationStat[];
  activites: ActiviteStat;
};
