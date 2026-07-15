import { z } from "zod";

import type { NumericAggregation } from "@/app/utils/math.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import type { BudgetApiType } from "./budget.schema";

export type StatistiquesAggregation = NumericAggregation;

export const statistiquesFiltersSchema = z.object({
  departements: z.string().nullable(),
  operateurs: z.string().nullable(),
  types: z.string().nullable(),
  aggregation: z
    .string()
    .nullable()
    .transform((value): NumericAggregation =>
      value === "mediane" ? "mediane" : "moyenne"
    ),
});

export type StatistiquesFilters = z.infer<typeof statistiquesFiltersSchema>;

// Types de lecture pure (pas d'input à valider) : pas de schéma zod, juste des types.

export type TypeStructureStat = {
  type: StructureType;
  structures: number;
  places: number;
};

export type BatiStat = {
  bati: Repartition;
  structures: number;
  places: number;
};

export type StructuresByYearStat = {
  year: number;
  totalStructures: number;
  totalCpoms: number;
  structuresCada: number;
  structuresCph: number;
  structuresHuda: number;
  structuresCaes: number;
  structuresBatiCollectif: number;
  structuresBatiDiffus: number;
  structuresBatiMixte: number;
};

export type PlacesIndicatorsStat = {
  totalPlaces: number;
  population: number | null;
  tauxEquipement: number | null;
  pmr: number;
  lgbt: number;
  fvvTeh: number;
  qpv: number;
  logementsSociaux: number;
};

export type PlacesByYearStat = PlacesIndicatorsStat & {
  year: number;
};

export type FinanceByYearScopeStat = {
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
};

export type FinanceByYearStat = {
  year: number;
  total: FinanceByYearScopeStat;
  autorisees: FinanceByYearScopeStat;
  subventionnees: FinanceByYearScopeStat;
};

export type EigCountTotalsStat = {
  nbEig: number;
  nbEigComportementViolent: number;
};

export type EigCountsStat = EigCountTotalsStat & {
  tauxEigComportementViolent: number | null;
};

export type EigRatesStat = EigCountsStat & {
  tauxEig: number | null;
};

export type ControleQualiteEvaluationSummaryStat = {
  moyenneEvaluationsCurrentYear: number | null;
};

export type EigStat = EigRatesStat & ControleQualiteEvaluationSummaryStat;

export type EigPeriodDeclarationStat = {
  nbStructuresSansDeclarationEig: number;
  partStructuresSansDeclarationEig: number | null;
};

export type EigPeriodStat = EigPeriodDeclarationStat & EigCountsStat;

export type ControleQualiteEvaluationStat = {
  nbStructuresEvaluees: number;
  noteGenerale: number | null;
  notePersonne: number | null;
  notePro: number | null;
  noteStructure: number | null;
};

export type ControleQualitePeriodBase = EigPeriodStat &
  ControleQualiteEvaluationStat;

export type ControleQualitePeriodStat = ControleQualitePeriodBase & {
  date: Date;
};

export type ControleQualiteByMonthStat = ControleQualitePeriodStat;
export type ControleQualiteByTrimesterStat = ControleQualitePeriodStat;
export type ControleQualiteByYearStat = ControleQualitePeriodStat;

export type ActiviteMotifsIndisponibiliteStat = {
  desinsectisation: number;
  remiseEnEtat: number;
  sousOccupation: number;
  travaux: number;
};

export type ActiviteSummaryStat = {
  placesEnregistreesDna: number;
  placesIndisponibles: number;
  placesDisponibles: number;
  tauxIndisponibilite: number | null;
  motifsIndisponibilite: ActiviteMotifsIndisponibiliteStat;
  presencesInduesBPI: number;
  tauxPresencesInduesBPI: number | null;
  presencesInduesDeboutees: number;
  tauxPresencesInduesDeboutees: number | null;
  presencesInduesTotal: number;
  tauxPresencesInduesTotal: number | null;
};

export type ActiviteByMonthStat = {
  date: Date;
  placesEnregistreesDna: number;
  placesIndisponibles: number;
  tauxIndisponibilite: number | null;
  presencesInduesBPI: number;
  tauxPresencesInduesBPI: number | null;
  presencesInduesDeboutees: number;
  tauxPresencesInduesDeboutees: number | null;
  presencesInduesTotal: number;
  tauxPresencesInduesTotal: number | null;
};

export type RmuPeriodStat = {
  date: Date;
  referesEngages: number;
  referesExecutes: number;
  tauxExecute: number | null;
};

export type RmuByMonthStat = RmuPeriodStat;
export type RmuByTrimesterStat = RmuPeriodStat;
export type RmuByYearStat = RmuPeriodStat;

export type StatistiqueApiRead = {
  structures: {
    totalStructures: number;
    totalPlaces: number;
    totalPlacesAdresse: number;
    totalCpoms: number;
    structuresAvecCpom: number;
    structureTypes: TypeStructureStat[];
    structureBatis: BatiStat[];
    byYear: StructuresByYearStat[];
  };
  places: PlacesIndicatorsStat & {
    byYear: PlacesByYearStat[];
  };
  finance: {
    byYear: FinanceByYearStat[];
  };
  controleQualite: {
    eig: EigStat;
    byMonth: ControleQualitePeriodStat[];
    byTrimester: ControleQualitePeriodStat[];
    byYear: ControleQualitePeriodStat[];
  };
  activite: {
    summary: ActiviteSummaryStat;
    byMonth: ActiviteByMonthStat[];
  };
  rmu: {
    byMonth: RmuPeriodStat[];
    byTrimester: RmuPeriodStat[];
    byYear: RmuPeriodStat[];
  } | null;
};

export type StatistiqueApiResponse = StatistiqueApiRead | null;

/** @deprecated Ancien type du mock page `/stats`
 * Benjamin : à remplacer par `StatistiqueApiRead`. */
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
  typesPlaces: {
    label: string;
    subLabel?: string;
    byYear: { year: number; nbPlaces: number }[];
  }[];
  structureTypes: {
    label: string;
    byYear: {
      year: number;
      nbStructures: number;
      nbCpoms: number;
      nbPlaces: number;
    }[];
  }[];
  structureBatis: {
    label: string;
    byYear: {
      year: number;
      nbStructures: number;
      nbCpoms: number;
      nbPlaces: number;
    }[];
  }[];
  finance: {
    byYear: {
      year: number;
      total: FinanceByYearScopeStat & { soldeCumule: number };
      autorisees: FinanceByYearScopeStat & { soldeCumule: number };
      subventionnees: FinanceByYearScopeStat & { soldeCumule: number };
    }[];
  };
};
