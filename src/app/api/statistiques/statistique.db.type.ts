import { Prisma } from "@/generated/prisma/client";

export type StructureRow = Prisma.StructureGetPayload<{
  select: {
    id: true;
    type: true;
    departementAdministratif: true;
  };
}>;

export type TypologieRow = Prisma.StructureTypologieGetPayload<{
  select: {
    structureId: true;
    year: true;
    placesAutorisees: true;
    pmr: true;
    lgbt: true;
    fvvTeh: true;
  };
}>;

export type AdresseRow = Prisma.AdresseGetPayload<{
  select: {
    structureId: true;
    repartition: true;
    logementSocial: true;
  };
}>;

export type EvaluationRow = Prisma.EvaluationGetPayload<{
  select: {
    date: true;
    note: true;
    notePersonne: true;
    notePro: true;
    noteStructure: true;
  };
}>;

export type EigRow = Prisma.EvenementIndesirableGraveGetPayload<{
  select: {
    type: true;
    evenementDate: true;
  };
}>;

export type ActiviteNativeRow = Prisma.ActiviteGetPayload<{
  select: {
    dnaCode: true;
    date: true;
    placesAutorisees: true;
    placesIndisponibles: true;
    placesOccupees: true;
    desinsectisation: true;
    remiseEnEtat: true;
    sousOccupation: true;
    travaux: true;
    presencesInduesBPI: true;
    presencesInduesDeboutees: true;
  };
}>;

export type IndicateurRow = Prisma.IndicateurFinancierGetPayload<{
  select: {
    structureId: true;
    year: true;
    type: true;
    ETP: true;
    tauxEncadrement: true;
    coutJournalier: true;
  };
}>;

export type DepartementRow = Prisma.DepartementGetPayload<{
  select: {
    numero: true;
    name: true;
    population: true;
  };
}>;

export type BudgetAggRow = {
  year: number;
  dotationDemandee: number;
  dotationAccordee: number;
  totalProduits: number;
  totalCharges: number;
};

export type MedianRow = {
  year: number;
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
};

export type GlobalMedianRow = {
  tauxEncadrementMedian: number | null;
  coutJournalierMedian: number | null;
};

/** Ligne retournée par le raw SQL DISTINCT ON (même shape qu'ActiviteNativeRow) */
export type ActiviteRow = ActiviteNativeRow;
