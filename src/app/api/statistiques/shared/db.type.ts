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
    structureId: true;
    year: true;
    placesAutorisees: true;
    pmr: true;
    lgbt: true;
    fvvTeh: true;
  };
}>;

export type StatistiqueDbAdresse = Prisma.AdresseGetPayload<{
  select: {
    id: true;
    structureId: true;
    repartition: true;
    qpv: true;
    logementSocial: true;
  };
}>;

export type StatistiqueDbAdresseTypologie = Prisma.AdresseTypologieGetPayload<{
  select: {
    adresseId: true;
    year: true;
    qpv: true;
    logementSocial: true;
    adresse: { select: { structureId: true } };
  };
}>;

export type StatistiqueDbEvaluation = Prisma.EvaluationGetPayload<{
  select: {
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
    dnaCode: true;
    type: true;
    evenementDate: true;
  };
}>;

export type StatistiqueDbDnaLink = Prisma.DnaStructureGetPayload<{
  select: {
    structureId: true;
    dna: { select: { code: true } };
  };
}>;

export type StatistiqueDbActivite = Prisma.ActiviteGetPayload<{
  select: {
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
    structureId: true;
    year: true;
    type: true;
    ETP: true;
    tauxEncadrement: true;
    coutJournalier: true;
  };
}>;

export type StatistiqueDbDepartement = Prisma.DepartementGetPayload<{
  select: {
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

export type StatistiqueDbCpomStructure = Prisma.CpomStructureGetPayload<{
  select: {
    cpomId: true;
    structureId: true;
    dateStart: true;
    dateEnd: true;
  };
}>;
