import { startOfNextUtcDay } from "@/app/utils/date.util";
import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";
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
  StatistiqueDbStructureActivity,
  StatistiqueDbStructureVersionTimeline,
  StatistiqueDbTypologie,
} from "./statistiques.db.type";

const excludedStructureTypes = new Set<string>(EXCLUDED_STRUCTURE_TYPES);

const buildStructureVersionWhereFromFilters = async (
  filters: StatistiquesFilters,
  reference?: Date
): Promise<Prisma.StructureVersionWhereInput> => {
  const where: Prisma.StructureVersionWhereInput = {};

  if (reference) {
    where.effectiveDate = { lt: startOfNextUtcDay(reference) };
  }

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

  return where;
};

export const findAllStructureIdsMatchingFilters = async (
  filters: StatistiquesFilters
): Promise<number[]> => {
  const where = await buildStructureVersionWhereFromFilters(filters);

  const rows = await prisma.structureVersion.findMany({
    where,
    select: { structureId: true },
    distinct: ["structureId"],
  });

  return rows
    .map((row) => row.structureId)
    .filter((id): id is number => id != null);
};

export const findEffectiveStructureVersionsAtDate = async (
  filters: StatistiquesFilters,
  reference: Date = new Date()
): Promise<StatistiqueDbEffectiveStructureVersion[]> => {
  const where = await buildStructureVersionWhereFromFilters(filters, reference);

  return prisma.structureVersion.findMany({
    where,
    select: {
      id: true,
      structureId: true,
      effectiveDate: true,
      type: true,
      departementAdministratif: true,
    },
    orderBy: [{ structureId: "asc" }, { effectiveDate: "desc" }],
    distinct: ["structureId"],
  });
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

export const findStructureAdresses = async (
  structureVersionIds: number[]
): Promise<StatistiqueDbAdresse[]> => {
  const rows = await prisma.adresse.findMany({
    where: { structureVersionId: { in: structureVersionIds } },
    select: {
      id: true,
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

  return prisma.structureVersion.findMany({
    where: { structureId: { in: structureIds } },
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
    orderBy: [{ structureId: "asc" }, { effectiveDate: "desc" }, { id: "desc" }],
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
