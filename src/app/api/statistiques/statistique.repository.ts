import { Prisma, Repartition, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

// ---- Row types (shapes returned by DB queries) ----

export type StructureRow = {
  id: number;
  type: StructureType | null;
  departementAdministratif: string | null;
};

export type TypologieRow = {
  structureId: number | null;
  year: number;
  placesAutorisees: number | null;
  pmr: number | null;
  lgbt: number | null;
  fvvTeh: number | null;
};

export type AdresseRow = {
  structureId: number | null;
  repartition: Repartition | null;
  logementSocial: number | null;
};

export type BudgetAggRow = {
  year: number;
  dotationDemandee: number;
  dotationAccordee: number;
  totalProduits: number;
  totalCharges: number;
};

export type IndicateurRow = {
  structureId: number | null;
  year: number;
  type: string;
  ETP: number | null;
  tauxEncadrement: number | null;
  coutJournalier: number | null;
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

export type EigRow = {
  type: string;
  evenementDate: Date;
};

export type EvaluationRow = {
  date: Date | null;
  note: number | null;
  notePersonne: number | null;
  notePro: number | null;
  noteStructure: number | null;
};

export type ActiviteRow = {
  dnaCode: string | null;
  date: Date;
  placesAutorisees: number | null;
  placesIndisponibles: number | null;
  placesOccupees: number | null;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  travaux: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
};

export type DepartementRow = {
  numero: string;
  name: string;
  population: number | null;
};

// ---- Query functions ----

export const findStructureIds = async (
  where: Prisma.StructureWhereInput
): Promise<number[]> => {
  // TODO: exclure les structures avec un acte de transformation de type fermeture effectif à date
  const rows = await prisma.structure.findMany({
    where,
    select: { id: true },
  });
  return rows.map((r) => r.id);
};

export const countCpoms = async (structureIds: number[]): Promise<number> => {
  return prisma.cpom.count({
    where: {
      structures: {
        some: { structureId: { in: structureIds } },
      },
    },
  });
};

export const findStructuresWithTypes = async (
  structureIds: number[]
): Promise<StructureRow[]> => {
  return prisma.structure.findMany({
    where: { id: { in: structureIds } },
    select: {
      id: true,
      type: true,
      departementAdministratif: true,
    },
  });
};

export const findStructureTypologies = async (
  structureIds: number[]
): Promise<TypologieRow[]> => {
  return prisma.structureTypologie.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      structureId: true,
      year: true,
      placesAutorisees: true,
      pmr: true,
      lgbt: true,
      fvvTeh: true,
    },
    orderBy: { year: "asc" },
  });
};

export const findStructureAdresses = async (
  structureIds: number[]
): Promise<AdresseRow[]> => {
  return prisma.adresse.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      structureId: true,
      repartition: true,
      logementSocial: true,
    },
  });
};

export const findBudgetsByYear = async (
  structureIds: number[]
): Promise<BudgetAggRow[]> => {
  const grouped = await prisma.budget.groupBy({
    by: ["year"],
    where: {
      structureId: { in: structureIds },
      isMissing: { not: true },
    },
    _sum: {
      dotationDemandee: true,
      dotationAccordee: true,
      totalProduits: true,
      totalCharges: true,
    },
    orderBy: { year: "asc" },
  });
  return grouped.map((g) => ({
    year: g.year,
    dotationDemandee: g._sum.dotationDemandee ?? 0,
    dotationAccordee: g._sum.dotationAccordee ?? 0,
    totalProduits: g._sum.totalProduits ?? 0,
    totalCharges: g._sum.totalCharges ?? 0,
  }));
};

/** Indicateurs bruts pour aggrégation ETP en TypeScript */
export const findIndicateursFinanciers = async (
  structureIds: number[]
): Promise<IndicateurRow[]> => {
  return prisma.indicateurFinancier.findMany({
    where: {
      structureId: { in: structureIds },
      isMissing: { not: true },
      // TODO: vérifier selon hypothèses cible (REALISE vs PREVISIONNEL)
      type: "REALISE",
    },
    select: {
      structureId: true,
      year: true,
      type: true,
      ETP: true,
      tauxEncadrement: true,
      coutJournalier: true,
    },
  });
};

/** Médiane taux d'encadrement + coût journalier par année — raw SQL (PERCENTILE_CONT) */
export const findMedianIndicateursByYear = async (
  structureIds: number[]
): Promise<MedianRow[]> => {
  if (structureIds.length === 0) return [];
  return prisma.$queryRaw<MedianRow[]>(Prisma.sql`
    SELECT
      year,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier"
    WHERE "structureId" IN (${Prisma.join(structureIds)})
      AND "isMissing" IS NOT TRUE
      AND type = 'REALISE'
    GROUP BY year
    ORDER BY year ASC
  `);
};

/** Médiane globale (tous millésimes confondus) */
export const findGlobalMedianIndicateurs = async (
  structureIds: number[]
): Promise<GlobalMedianRow> => {
  if (structureIds.length === 0)
    return { tauxEncadrementMedian: null, coutJournalierMedian: null };
  const [row] = await prisma.$queryRaw<GlobalMedianRow[]>(Prisma.sql`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier"
    WHERE "structureId" IN (${Prisma.join(structureIds)})
      AND "isMissing" IS NOT TRUE
      AND type = 'REALISE'
  `);
  return row ?? { tauxEncadrementMedian: null, coutJournalierMedian: null };
};

/** Codes DNA liés aux structures filtrées */
export const findDnaCodes = async (
  structureIds: number[]
): Promise<string[]> => {
  const rows = await prisma.dnaStructure.findMany({
    where: { structureId: { in: structureIds } },
    select: { dna: { select: { code: true } } },
  });
  return [...new Set(rows.map((r) => r.dna.code))];
};

export const findEigs = async (
  dnaCodes: string[],
  since: Date
): Promise<EigRow[]> => {
  if (dnaCodes.length === 0) return [];
  return prisma.evenementIndesirableGrave.findMany({
    where: {
      dnaCode: { in: dnaCodes },
      evenementDate: { gte: since },
    },
    select: { type: true, evenementDate: true },
  });
};

export const findEvaluations = async (
  structureIds: number[]
): Promise<EvaluationRow[]> => {
  return prisma.evaluation.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      date: true,
      note: true,
      notePersonne: true,
      notePro: true,
      noteStructure: true,
    },
  });
};

/**
 * Dernier millésime mensuel par DNA — raw SQL DISTINCT ON.
 * Permet d'agréger sur l'état courant des activités.
 */
export const findLatestActivitesPerDna = async (
  dnaCodes: string[]
): Promise<ActiviteRow[]> => {
  if (dnaCodes.length === 0) return [];
  return prisma.$queryRaw<ActiviteRow[]>(Prisma.sql`
    SELECT DISTINCT ON (a."dnaCode")
      a."dnaCode",
      a.date,
      a."placesAutorisees",
      a."placesIndisponibles",
      a."placesOccupees",
      a.desinsectisation,
      a."remiseEnEtat",
      a."sousOccupation",
      a.travaux,
      a."presencesInduesBPI",
      a."presencesInduesDeboutees"
    FROM public."Activite" a
    WHERE a."dnaCode" IN (${Prisma.join(dnaCodes)})
    ORDER BY a."dnaCode", a.date DESC
  `);
};

/** Toutes les activités — pour le suivi des présences indues dans le temps */
export const findActivitesTimeSeries = async (
  dnaCodes: string[]
): Promise<ActiviteRow[]> => {
  if (dnaCodes.length === 0) return [];
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      dnaCode: true,
      date: true,
      placesAutorisees: true,
      placesIndisponibles: true,
      placesOccupees: true,
      desinsectisation: true,
      remiseEnEtat: true,
      sousOccupation: true,
      travaux: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "asc" },
  });
};

export const findDepartementsWithPopulation = async (
  departementNumeros: string[]
): Promise<DepartementRow[]> => {
  return prisma.departement.findMany({
    where:
      departementNumeros.length > 0
        ? { numero: { in: departementNumeros } }
        : undefined,
    select: { numero: true, name: true, population: true },
  });
};
