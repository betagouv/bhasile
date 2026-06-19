import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../statistiques.db.type";

export const findStructureIds = async (
  where: Prisma.StructureWhereInput
): Promise<number[]> => {
  // TODO(structure-version): filtrer/exclure via shared/utils (fermeture effective, champs version)
  const rows = await prisma.structure.findMany({
    where,
    select: { id: true },
  });
  return rows.map((row) => row.id);
};

export const findStructuresWithTypes = async (
  structureIds: number[]
): Promise<StatistiqueDbStructure[]> => {
  // TODO(structure-version): lire type/département depuis version effective (shared/utils)
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
      id: true,
      structureId: true,
      repartition: true,
      placesAutorisees: true,
      qpv: true,
      logementSocial: true,
    },
  });
};

export const findAdresseTypologies = async (
  structureIds: number[]
): Promise<StatistiqueDbAdresseTypologie[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.adresseTypologie.findMany({
    where: { adresse: { structureId: { in: structureIds } } },
    select: {
      adresseId: true,
      year: true,
      qpv: true,
      logementSocial: true,
      adresse: { select: { structureId: true } },
    },
    orderBy: { year: "asc" },
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
    select: { numero: true, name: true, population: true },
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
