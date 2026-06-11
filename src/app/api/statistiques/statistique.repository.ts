import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import type {
  StatistiqueDbActivite,
  StatistiqueDbAdresse,
  StatistiqueDbBudgetAgg,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
  StatistiqueDbIndicateurMedianGlobal,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbIndicateurMedian,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./statistique.db.type";

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

export const findCpomStructures = async (
  structureIds: number[]
): Promise<StatistiqueDbCpomStructure[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.cpomStructure.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      cpomId: true,
      structureId: true,
      dateStart: true,
      dateEnd: true,
    },
  });
};

export const findStructuresWithTypes = async (
  structureIds: number[]
): Promise<StatistiqueDbStructure[]> => {
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
): Promise<StatistiqueDbTypologie[]> => {
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
): Promise<StatistiqueDbAdresse[]> => {
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
): Promise<StatistiqueDbBudgetAgg[]> => {
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
  return grouped.map((group) => ({
    year: group.year,
    dotationDemandee: group._sum.dotationDemandee ?? 0,
    dotationAccordee: group._sum.dotationAccordee ?? 0,
    totalProduits: group._sum.totalProduits ?? 0,
    totalCharges: group._sum.totalCharges ?? 0,
  }));
};

/** Indicateurs bruts pour aggrégation ETP */
export const findIndicateursFinanciers = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurFinancier[]> => {
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

/** Médiane taux d'encadrement + coût journalier par année */
export const findYearlyMedianIndicateurs = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedian[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbIndicateurMedian[]>(Prisma.sql`
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

/** Médiane globale */
export const findGlobalMedianIndicateurs = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedianGlobal> => {
  if (structureIds.length === 0) {
    return { tauxEncadrementMedian: null, coutJournalierMedian: null };
  }
  const [row] = await prisma.$queryRaw<
    StatistiqueDbIndicateurMedianGlobal[]
  >(Prisma.sql`
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
): Promise<StatistiqueDbEig[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
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
): Promise<StatistiqueDbEvaluation[]> => {
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

/** Dernier millésime mensuel par DNA pour agréger sur l'état courant des activités. */
export const findLatestActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbActivite[]>(Prisma.sql`
    SELECT DISTINCT ON (a."dnaCode")
      a.date,
      a."placesAutorisees",
      a."placesIndisponibles",
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

/** Toutes les activités, pour le suivi des présences indues dans le temps */
export const findActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      date: true,
      placesAutorisees: true,
      placesIndisponibles: true,
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
): Promise<StatistiqueDbDepartement[]> => {
  return prisma.departement.findMany({
    where:
      departementNumeros.length > 0
        ? { numero: { in: departementNumeros } }
        : undefined,
    select: { numero: true, name: true, population: true },
  });
};
