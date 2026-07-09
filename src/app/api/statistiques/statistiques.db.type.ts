import { Prisma, StructureType } from "@/generated/prisma/client";

export type StatistiqueDbStructure = Prisma.StructureGetPayload<{
  select: {
    id: true;
    type: true;
    departementAdministratif: true;
  };
}>;

export type StatistiqueDbStructureActivity = Prisma.StructureGetPayload<{
  select: {
    id: true;
    creationDate: true;
    fermetureDate: true;
  };
}>;

export type StatistiqueDbEffectiveStructureVersion = {
  id: number;
  structureId: number | null;
  effectiveDate: Date | null;
  type: StructureType | null;
  departementAdministratif: string | null;
};

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
      qpv: true;
      logementSocial: true;
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
    structureId: true;
    structureVersionId: true;
    dna: { select: { code: true } };
  };
}>;

export type StatistiqueDbStructureVersionTimeline =
  StatistiqueDbEffectiveStructureVersion;

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

export type StatistiqueDbDepartement = Prisma.DepartementGetPayload<{
  select: {
    id: true;
    numero: true;
    name: true;
    population: true;
  };
}>;

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
  budgets: StatistiqueDbBudget[];
  indicateurs: StatistiqueDbIndicateurFinancier[];
  activites: StatistiqueDbActivite[];
};
