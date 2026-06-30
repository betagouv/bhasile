import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";
import { startOfNextUtcDay } from "@/app/utils/date.util";
import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import type { StatistiquesFilters } from "@/schemas/api/statistique.schema";

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
  StatistiqueDbTypologie,
} from "./statistiques.db.type";

const excludedStructureTypes = new Set<string>(EXCLUDED_STRUCTURE_TYPES);

export const findEffectiveStructureVersionsAtDate = async (
  filters: StatistiquesFilters,
  reference: Date = new Date()
): Promise<StatistiqueDbEffectiveStructureVersion[]> => {
  const where: Prisma.StructureVersionWhereInput = {
    effectiveDate: { lt: startOfNextUtcDay(reference) },
  };

  const depList = filters.departements?.split(",").filter(Boolean) ?? [];
  if (depList.length > 0) {
    where.departementAdministratif = { in: depList };
  }

  const operateurIds =
    filters.operateurs?.split(",").filter(Boolean).map(Number) ?? [];
  if (operateurIds.length > 0) {
    const filiales = await prisma.operateur.findMany({
      where: { parentId: { in: operateurIds } },
      select: { id: true },
    });
    const allOperateurIds = [
      ...new Set([...operateurIds, ...filiales.map((filiale) => filiale.id)]),
    ];
    where.structure = { operateurId: { in: allOperateurIds } };
  }

  const typeList = filters.types?.split(",").filter(Boolean) ?? [];
  where.type =
    typeList.length > 0
      ? {
          not: null,
          in: typeList.filter(
            (type) => !excludedStructureTypes.has(type)
          ) as StructureType[],
        }
      : {
          not: null,
          notIn: [...EXCLUDED_STRUCTURE_TYPES] as StructureType[],
        };

  return prisma.structureVersion.findMany({
    where,
    select: {
      id: true,
      structureId: true,
      effectiveDate: true,
      type: true,
      departementAdministratif: true,
      structureVersionTransformation: {
        select: {
          type: true,
        },
      },
    },
    orderBy: [{ structureId: "asc" }, { effectiveDate: "desc" }],
    distinct: ["structureId"],
  });
};

export const findFirstEffectiveDateByStructure = async (
  structureIds: number[]
): Promise<Map<number, Date>> => {
  if (structureIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.structureVersion.groupBy({
    by: ["structureId"],
    where: {
      structureId: { in: structureIds },
      effectiveDate: { not: null },
    },
    _min: { effectiveDate: true },
  });

  const openingDateByStructureId = new Map<number, Date>();
  for (const row of rows) {
    if (row.structureId != null && row._min.effectiveDate != null) {
      openingDateByStructureId.set(
        row.structureId,
        new Date(row._min.effectiveDate)
      );
    }
  }

  return openingDateByStructureId;
};

export const findStructureTypologies = async (
  structureIds: number[]
): Promise<StatistiqueDbTypologie[]> => {
  const rows = await prisma.structureTypologie.findMany({
    where: {
      OR: [
        { structureId: { in: structureIds } },
        { structureVersion: { structureId: { in: structureIds } } },
      ],
    },
    select: {
      id: true,
      structureId: true,
      structureVersion: { select: { structureId: true } },
      year: true,
      placesAutorisees: true,
      pmr: true,
      lgbt: true,
      fvvTeh: true,
    },
    orderBy: { year: "asc" },
  });
  // Normalise structureId post-migration (via structureVersion).
  return rows.map((row) => {
    const structureId =
      row.structureId ?? row.structureVersion?.structureId ?? null;
    // Drop the helper join field from the returned shape to match StatistiqueDbTypologie.
    return {
      id: row.id,
      structureId,
      year: row.year,
      placesAutorisees: row.placesAutorisees,
      pmr: row.pmr,
      lgbt: row.lgbt,
      fvvTeh: row.fvvTeh,
    };
  });
};

export const findStructureAdresses = async (
  structureVersionIds: number[]
): Promise<StatistiqueDbAdresse[]> => {
  if (structureVersionIds.length === 0) {
    return [];
  }
  const rows = await prisma.adresse.findMany({
    where: { structureVersionId: { in: structureVersionIds } },
    select: {
      id: true,
      structureId: true,
      structureVersion: { select: { structureId: true } },
      repartition: true,
      placesAutorisees: true,
      qpv: true,
      logementSocial: true,
    },
  });
  // Normalise structureId post-migration (via structureVersion).
  return rows.map((row) => {
    const structureId =
      row.structureId ?? row.structureVersion?.structureId ?? null;
    // Drop the helper join field from the returned shape to match StatistiqueDbAdresse.
    return {
      id: row.id,
      structureId,
      repartition: row.repartition,
      placesAutorisees: row.placesAutorisees,
      qpv: row.qpv,
      logementSocial: row.logementSocial,
    };
  });
};

export const findDnaLinksByStructure = async (
  structureIds: number[]
): Promise<StatistiqueDbDnaLink[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.dnaStructure.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      dna: { select: { code: true } },
    },
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
      type: { in: ["REALISE", "PREVISIONNEL"] },
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
      placesIndisponibles: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "asc" },
  });
};
