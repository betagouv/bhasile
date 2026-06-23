import { Prisma } from "@/generated/prisma/client";

export type StatistiqueDbStructure = Prisma.StructureGetPayload<{
  select: {
    id: true;
    type: true;
    departementAdministratif: true;
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

export type StatistiqueDbAdresse = Prisma.AdresseGetPayload<{
  select: {
    id: true;
    structureId: true;
    repartition: true;
    placesAutorisees: true;
    qpv: true;
    logementSocial: true;
  };
}>;

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
    dna: { select: { code: true } };
  };
}>;

export type StatistiqueDbActivite = Prisma.ActiviteGetPayload<{
  select: {
    id: true;
    dnaCode: true;
    date: true;
    placesAutorisees: true;
    placesIndisponibles: true;
    presencesInduesBPI: true;
    presencesInduesDeboutees: true;
  };
}>;

export type StatistiqueDbIndicateurFinancier = Prisma.IndicateurFinancierGetPayload<{
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

export type StatistiquesContext = {
  structureIds: number[];
  structures: StatistiqueDbStructure[];
  typologies: StatistiqueDbTypologie[];
  adresses: StatistiqueDbAdresse[];
  cpomLinks: StatistiqueDbCpomStructure[];
  dnaLinks: StatistiqueDbDnaLink[];
  dnaCodes: string[];
  departements: StatistiqueDbDepartement[];
};
