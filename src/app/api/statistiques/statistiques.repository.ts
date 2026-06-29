import { EXCLUDED_STRUCTURE_TYPES } from "@/constants";
import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import type { StatistiquesFilters } from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbEffectiveStructureVersion,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./statistiques.db.type";

const excludedStructureTypes = new Set<string>(EXCLUDED_STRUCTURE_TYPES);

const buildTypeWhere = (
  filters: StatistiquesFilters
): Prisma.StructureVersionWhereInput["type"] => {
  const typeList = filters.types?.split(",").filter(Boolean) ?? [];

  if (typeList.length > 0) {
    return {
      not: null,
      in: typeList.filter(
        (type) => !excludedStructureTypes.has(type)
      ) as StructureType[],
    };
  }

  return {
    not: null,
    notIn: EXCLUDED_STRUCTURE_TYPES as unknown as StructureType[],
  };
};

const resolveOperateurIdsWithFiliales = async (
  operateurIds: number[]
): Promise<number[]> => {
  if (operateurIds.length === 0) {
    return [];
  }
  const filiales = await prisma.operateur.findMany({
    where: { parentId: { in: operateurIds } },
    select: { id: true },
  });
  return [...new Set([...operateurIds, ...filiales.map((filiale) => filiale.id)])];
};

const buildEffectiveStructureVersionWhereAtDate = async (
  filters: StatistiquesFilters,
  atDate: Date
): Promise<Prisma.StructureVersionWhereInput> => {
  const where: Prisma.StructureVersionWhereInput = {
    effectiveDate: { lte: atDate },
  };

  const depList = filters.departements?.split(",").filter(Boolean) ?? [];
  if (depList.length > 0) {
    where.departementAdministratif = { in: depList };
  }

  const operateurIds =
    filters.operateurs?.split(",").filter(Boolean).map(Number) ?? [];
  if (operateurIds.length > 0) {
    const allOperateurIds = await resolveOperateurIdsWithFiliales(operateurIds);
    where.structure = { operateurId: { in: allOperateurIds } };
  }

  // Types are evaluated on the effective version at date.
  where.type = buildTypeWhere(filters);

  return where;
};

export const findEffectiveStructureVersions = async (
  where: Prisma.StructureVersionWhereInput
): Promise<StatistiqueDbEffectiveStructureVersion[]> => {
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

export const findEffectiveStructureVersionsAtDate = async (
  filters: StatistiquesFilters,
  atDate: Date
): Promise<StatistiqueDbEffectiveStructureVersion[]> => {
  const where = await buildEffectiveStructureVersionWhereAtDate(filters, atDate);
  return findEffectiveStructureVersions(where);
};

export const findStructureIds = async (
  where: Prisma.StructureWhereInput
): Promise<number[]> => {
  const rows = await prisma.structure.findMany({
    where,
    select: { id: true },
  });
  return rows.map((row) => row.id);
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
    const structureId = row.structureId ?? row.structureVersion?.structureId ?? null;
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
    const structureId = row.structureId ?? row.structureVersion?.structureId ?? null;
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
