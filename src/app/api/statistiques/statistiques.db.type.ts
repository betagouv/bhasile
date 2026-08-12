import { Prisma } from "@/generated/prisma/client";

export type StatistiqueDbStructure = Prisma.StructureGetPayload<{
  select: {
    id: true;
    type: true;
    departementAdministratif: true;
    arrondissementCode: true;
  };
}>;

export type StatistiqueDbStructureActivity = Prisma.StructureGetPayload<{
  select: {
    id: true;
    creationDate: true;
    fermetureDate: true;
  };
}>;

export type StatistiqueDbTypologie = Prisma.StructureTypologieGetPayload<{
  select: {
    id: true;
    structureId: true;
    year: true;
    placesAutorisees: true;
    pmr: true;
    lgbt: true;
    fvvTeh: true;
  };
}>;

export type StatistiqueDbTypologieValues = Omit<StatistiqueDbTypologie, "id">;

/** `structureId` / `structureVersionId` : garantis non nuls par le scope de la requête (`findStructureAdresses`). */
export type StatistiqueDbAdresse = Omit<
  Prisma.AdresseGetPayload<{
    select: {
      id: true;
      structureId: true;
      structureVersionId: true;
      repartition: true;
      placesAutorisees: true;
      isQpv: true;
      isLogementSocial: true;
    };
  }>,
  "structureId" | "structureVersionId"
> & {
  structureId: number;
  structureVersionId: number;
};

export type StatistiqueDbEvaluation = Prisma.EvaluationGetPayload<{
  select: {
    id: true;
    structureId: true;
    date: true;
    note: true;
    notePersonne: true;
    notePro: true;
    noteStructure: true;
  };
}>;

export type StatistiqueDbEig = Prisma.EvenementIndesirableGraveGetPayload<{
  select: {
    id: true;
    dnaCode: true;
    type: true;
    evenementDate: true;
  };
}>;

export type StatistiqueDbDnaLink = Prisma.DnaStructureGetPayload<{
  select: {
    id: true;
    structureVersionId: true;
    dna: { select: { code: true } };
  };
}> & { structureId: number };

/** Timeline des `StructureVersion` d'une structure */
export type StatistiqueDbStructureVersionTimeline = {
  id: number;
  structureId: number | null;
  effectiveDate: Date | null;
  placesAutorisees: number | null;
};

export type StatistiqueDbActivite = Prisma.ActiviteGetPayload<{
  select: {
    id: true;
    dnaCode: true;
    date: true;
    placesAutorisees: true;
    desinsectisation: true;
    remiseEnEtat: true;
    sousOccupation: true;
    travaux: true;
    placesIndisponibles: true;
    placesOccupees: true;
    presencesInduesBPI: true;
    presencesInduesDeboutees: true;
  };
}>;

export type StatistiqueDbIndicateurFinancier =
  Prisma.IndicateurFinancierGetPayload<{
    select: {
      id: true;
      structureId: true;
      year: true;
      type: true;
      ETP: true;
      tauxEncadrement: true;
      coutJournalier: true;
    };
  }>;

export type StatistiqueDbIndicateurFinancierMetriques = Omit<
  StatistiqueDbIndicateurFinancier,
  "id" | "structureId" | "year" | "type"
>;

export type StatistiqueDbRmu = Prisma.RmuGetPayload<{
  select: {
    id: true;
    departementNumero: true;
    date: true;
    referesEngages: true;
    referesExecutes: true;
  };
}>;

export type StatistiqueDbDepartement = Prisma.DepartementGetPayload<{
  select: {
    numero: true;
    name: true;
    population: true;
  };
}>;

export type StatistiqueDbArrondissement = Prisma.ArrondissementGetPayload<{
  select: {
    code: true;
    name: true;
    departementNumero: true;
    population: true;
  };
}>;

/** Base de calcul du taux d'équipement : départements, ou arrondissements si le filtre est actif. */
export type StatistiquePopulationScope = { population: number | null };

export type StatistiqueDbBudgetAgg = {
  year: number;
  dotationDemandee: number;
  dotationAccordee: number;
  totalProduits: number;
  totalCharges: number;
};

export type StatistiqueDbBudget = StatistiqueDbBudgetAgg & {
  id: number;
  structureId: number;
};

export type StatistiqueDbCpomStructure = Prisma.CpomStructureGetPayload<{
  select: {
    id: true;
    cpomId: true;
    structureId: true;
    dateStart: true;
    dateEnd: true;
    cpom: {
      select: {
        actesAdministratifs: {
          select: {
            id: true;
            category: true;
            startDate: true;
            endDate: true;
            parentId: true;
          };
        };
      };
    };
  };
}>;

/** Dates d'ouverture/fermeture du périmètre filtré (`Structure.creationDate` / `fermetureDate`). */
export type StatistiquesActivityContext = {
  allStructureIds: number[];
  openingDateByStructureId: Map<number, Date>;
  closureDateByStructureId: Map<number, Date | null>;
};

export type StatistiquesPeriodGranularity = "month" | "trimester" | "year";

/** Index construit une seule fois à la racine - lecture seule dans les sous-modules. */
export type StatistiquesActiveStructureIdsByPeriod = Record<
  StatistiquesPeriodGranularity,
  Map<string, Set<number>>
>;

export type StatistiquesContext = {
  /** Structures ouvertes à la date de référence (indicateurs globaux). */
  structures: StatistiqueDbStructure[];
  /** Toutes les structures du périmètre filtré (ouvertes + fermées). */
  allStructures: StatistiqueDbStructure[];
  /** IDs des structures ouvertes à la date de référence (indicateurs agrégés). */
  activeStructureIdsNow: Set<number>;
  /** Index des structures actives par période (séries temporelles). */
  activeStructureIdsByPeriod: StatistiquesActiveStructureIdsByPeriod;
  eigs: StatistiqueDbEig[];
  evaluations: StatistiqueDbEvaluation[];
  typologies: StatistiqueDbTypologie[];
  adresses: StatistiqueDbAdresse[];
  cpomLinks: StatistiqueDbCpomStructure[];
  dnaLinks: StatistiqueDbDnaLink[];
  structureVersionTimeline: StatistiqueDbStructureVersionTimeline[];
  departements: StatistiqueDbDepartement[];
  /** Renseigné uniquement quand le filtre `arrondissements` est actif : affine le taux d'équipement. */
  arrondissements: StatistiqueDbArrondissement[];
  budgets: StatistiqueDbBudget[];
  indicateurs: StatistiqueDbIndicateurFinancier[];
  activites: StatistiqueDbActivite[];
  rmus: StatistiqueDbRmu[] | null;
  /** Résolveur `dnaCode x structures` mémoïsé, partagé entre zones. */
  resolveDnaStructureIds: DnaStructureIdsResolver;
};

export type DnaStructureIdsResolver = (dnaCode: string, date: Date) => number[];

/** Minimal slice of StatistiquesContext needed to resolve structures + typologie for a given year. */
export type StatistiquesTypologieYearContext = Pick<
  StatistiquesContext,
  "allStructures" | "activeStructureIdsByPeriod" | "typologies"
>;

/** Adds CPOM links, for indicators counting structures covered by an active CPOM per year. */
export type StatistiquesCpomYearContext = StatistiquesTypologieYearContext &
  Pick<StatistiquesContext, "cpomLinks">;

/** Structures actives + adresses, pour le snapshot QPV / logement social. */
export type StatistiquesAdresseSnapshotContext = Pick<
  StatistiquesContext,
  "structures" | "adresses" | "structureVersionTimeline"
>;

/** Minimal slice of StatistiquesContext needed to compute the current activite snapshot. */
export type StatistiquesActiviteSummaryContext = Pick<
  StatistiquesContext,
  "activites" | "resolveDnaStructureIds" | "allStructures" | "structures"
>;

/** Minimal slice of StatistiquesContext needed to compute the activite monthly series. */
export type StatistiquesActiviteByMonthContext = Pick<
  StatistiquesContext,
  | "activites"
  | "resolveDnaStructureIds"
  | "allStructures"
  | "activeStructureIdsByPeriod"
>;
