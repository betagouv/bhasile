import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { startOfNextUtcDay } from "@/app/utils/date.util";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import type {
  StatistiqueDbActivite,
  StatistiqueDbAdresse,
  StatistiqueDbBudget,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbEffectiveStructureVersion,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbRmu,
  StatistiqueDbStructureActivity,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologie,
} from "./statistiques.db.type";
import {
  matchesStatistiquesPerimeterFilters,
  type StatistiquesResolvedPerimeterFilters,
} from "./statistiques.utils";

/** Une version liée à une transformation non finalisée n'est jamais "effective". */
const FINALIZED_VERSION_WHERE: Prisma.StructureVersionWhereInput = {
  OR: [
    { structureVersionTransformationId: null },
    {
      structureVersionTransformation: {
        transformation: {
          form: {
            status: true,
            formDefinition: { slug: FINALISATION_FORM_SLUG },
          },
        },
      },
    },
  ],
};

/** Filiales directes des opérateurs donnés (résolution du filtre `operateurs`, cf. statistique.service). */
export const findOperateurFiliales = async (
  parentIds: number[]
): Promise<{ id: number }[]> => {
  if (parentIds.length === 0) {
    return [];
  }
  return prisma.operateur.findMany({
    where: { parentId: { in: parentIds } },
    select: { id: true },
  });
};

/**
 * Résout la version réellement effective de chaque structure à `reference`
 * (dernière version finalisée), puis applique `resolved` sur cet état résolu.
 */
export const findEffectiveStructureVersionsAtDate = async (
  resolved: StatistiquesResolvedPerimeterFilters,
  reference: Date = new Date()
): Promise<StatistiqueDbEffectiveStructureVersion[]> => {
  const versions = await prisma.structureVersion.findMany({
    where: {
      ...FINALIZED_VERSION_WHERE,
      effectiveDate: { lt: startOfNextUtcDay(reference) },
    },
    select: {
      id: true,
      structureId: true,
      effectiveDate: true,
      departementAdministratif: true,
      structure: { select: { operateurId: true, type: true } },
    },
    orderBy: [
      { structureId: "asc" },
      { effectiveDate: "desc" },
      { id: "desc" },
    ],
    distinct: ["structureId"],
  });

  return versions
    .filter((version) => matchesStatistiquesPerimeterFilters(version, resolved))
    .map((version) => ({
      id: version.id,
      structureId: version.structureId,
      effectiveDate: version.effectiveDate,
      type: version.structure?.type ?? null,
      departementAdministratif: version.departementAdministratif,
    }));
};

export const findStructureActivityDates = async (
  structureIds: number[]
): Promise<StatistiqueDbStructureActivity[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  return prisma.structure.findMany({
    where: { id: { in: structureIds } },
    select: {
      id: true,
      creationDate: true,
      fermetureDate: true,
    },
  });
};

const structureVersionScope = (structureIds: number[]) => ({
  structureVersion: { structureId: { in: structureIds } },
});

const structureIdFromVersion = (row: {
  structureVersion: { structureId: number | null } | null;
}): number => row.structureVersion!.structureId!;

export const findStructureTypologies = async (
  structureIds: number[]
): Promise<StatistiqueDbTypologie[]> => {
  const rows = await prisma.structureTypologie.findMany({
    where: structureVersionScope(structureIds),
    select: {
      id: true,
      structureVersion: { select: { structureId: true } },
      year: true,
      placesAutorisees: true,
      pmr: true,
      lgbt: true,
      fvvTeh: true,
    },
    orderBy: { year: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    structureId: structureIdFromVersion(row),
    year: row.year,
    placesAutorisees: row.placesAutorisees,
    pmr: row.pmr,
    lgbt: row.lgbt,
    fvvTeh: row.fvvTeh,
  }));
};

/** Historique complet (toutes versions) - la résolution "à quelle date" se fait en aval. */
export const findStructureAdresses = async (
  structureIds: number[]
): Promise<StatistiqueDbAdresse[]> => {
  const rows = await prisma.adresse.findMany({
    where: structureVersionScope(structureIds),
    select: {
      id: true,
      structureVersionId: true,
      structureVersion: { select: { structureId: true } },
      repartition: true,
      placesAutorisees: true,
      qpv: true,
      logementSocial: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    structureId: structureIdFromVersion(row),
    structureVersionId: row.structureVersionId!,
    repartition: row.repartition,
    placesAutorisees: row.placesAutorisees,
    qpv: row.qpv,
    logementSocial: row.logementSocial,
  }));
};

export const findDnaLinks = async (
  structureIds: number[]
): Promise<StatistiqueDbDnaLink[]> => {
  const rows = await prisma.dnaStructure.findMany({
    where: structureVersionScope(structureIds),
    select: {
      id: true,
      structureVersionId: true,
      structureVersion: { select: { structureId: true } },
      dna: { select: { code: true } },
    },
  });

  return rows
    .filter((row) => row.structureVersionId != null)
    .map((row) => ({
      id: row.id,
      structureId: structureIdFromVersion(row),
      structureVersionId: row.structureVersionId!,
      dna: row.dna,
    }));
};

export const findStructureVersionTimeline = async (
  structureIds: number[]
): Promise<StatistiqueDbStructureVersionTimeline[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  const versions = await prisma.structureVersion.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      effectiveDate: true,
      departementAdministratif: true,
      structure: { select: { type: true } },
    },
    orderBy: [
      { structureId: "asc" },
      { effectiveDate: "desc" },
      { id: "desc" },
    ],
  });

  return versions.map((version) => ({
    id: version.id,
    structureId: version.structureId,
    effectiveDate: version.effectiveDate,
    type: version.structure?.type ?? null,
    departementAdministratif: version.departementAdministratif,
  }));
};

export const findDepartementsWithPopulation = async (
  departementNumeros: string[]
): Promise<StatistiqueDbDepartement[]> => {
  return prisma.departement.findMany({
    where:
      departementNumeros.length > 0
        ? { numero: { in: departementNumeros } }
        : undefined,
    select: { id: true, numero: true, name: true, population: true },
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
      id: true,
      cpomId: true,
      structureId: true,
      dateStart: true,
      dateEnd: true,
      cpom: {
        select: {
          actesAdministratifs: {
            select: {
              id: true,
              category: true,
              startDate: true,
              endDate: true,
              parentId: true,
            },
          },
        },
      },
    },
  });
};

export const findEigs = async (
  dnaCodes: string[]
): Promise<StatistiqueDbEig[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.evenementIndesirableGrave.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: { id: true, dnaCode: true, type: true, evenementDate: true },
    orderBy: { evenementDate: "asc" },
  });
};

export const findEvaluations = async (
  structureIds: number[]
): Promise<StatistiqueDbEvaluation[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.evaluation.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      date: true,
      note: true,
      notePersonne: true,
      notePro: true,
      noteStructure: true,
    },
    orderBy: { date: "asc" },
  });
};

export const findBudgets = async (
  structureIds: number[]
): Promise<StatistiqueDbBudget[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  const budgets = await prisma.budget.findMany({
    where: {
      structureId: { in: structureIds },
      OR: [{ isMissing: null }, { isMissing: false }],
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      dotationDemandee: true,
      dotationAccordee: true,
      totalProduits: true,
      totalCharges: true,
    },
    orderBy: [{ year: "asc" }, { structureId: "asc" }],
  });

  return budgets.flatMap((budget) => {
    if (budget.structureId === null) {
      return [];
    }

    return [
      {
        id: budget.id,
        structureId: budget.structureId,
        year: budget.year,
        dotationDemandee: budget.dotationDemandee ?? 0,
        dotationAccordee: budget.dotationAccordee ?? 0,
        totalProduits: budget.totalProduits ?? 0,
        totalCharges: budget.totalCharges ?? 0,
      },
    ];
  });
};

export const findIndicateursFinanciers = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurFinancier[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.indicateurFinancier.findMany({
    where: {
      structureId: { in: structureIds },
      OR: [{ isMissing: null }, { isMissing: false }],
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      type: true,
      ETP: true,
      tauxEncadrement: true,
      coutJournalier: true,
    },
  });
};

export const findRmus = async (
  departementNumeros: Set<string> | null
): Promise<StatistiqueDbRmu[]> => {
  return prisma.rmu.findMany({
    where: departementNumeros
      ? { departementNumero: { in: [...departementNumeros] } }
      : undefined,
    select: {
      id: true,
      departementNumero: true,
      date: true,
      referesEngages: true,
      referesExecutes: true,
    },
    orderBy: { date: "asc" },
  });
};

export const findActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      id: true,
      dnaCode: true,
      date: true,
      placesAutorisees: true,
      desinsectisation: true,
      remiseEnEtat: true,
      sousOccupation: true,
      travaux: true,
      placesIndisponibles: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "asc" },
  });
};
