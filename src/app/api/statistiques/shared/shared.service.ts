import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "../statistiques.db.type";
import {
  findAdresseTypologies,
  findDepartementsWithPopulation,
  findCpomStructures,
  findDnaLinksByStructure,
  findStructureAdresses,
  findStructureIds,
  findStructuresWithTypes,
  findStructureTypologies,
} from "./shared.repository";

export type StatistiquesContext = {
  structureIds: number[];
  structures: StatistiqueDbStructure[];
  typologies: StatistiqueDbTypologie[];
  adresses: StatistiqueDbAdresse[];
  adresseTypologies: StatistiqueDbAdresseTypologie[];
  cpomLinks: StatistiqueDbCpomStructure[];
  dnaLinks: StatistiqueDbDnaLink[];
  dnaCodes: string[];
  departements: StatistiqueDbDepartement[];
};

const buildStructureWhere = async (
  filters: StatistiquesFiltersRaw
): Promise<Prisma.StructureWhereInput> => {
  // TODO(structure-version): filtrer type/département sur version effective (shared/utils)
  const where: Prisma.StructureWhereInput = {};

  const typeList = filters.types?.split(",").filter(Boolean) ?? [];
  if (typeList.length > 0) {
    where.type = { in: typeList as StructureType[] };
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
    where.operateurId = { in: allOperateurIds };
  }

  return where;
};

export const buildStatistiquesContext = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiquesContext | null> => {
  const where = await buildStructureWhere(filters);
  const structureIds = await findStructureIds(where);

  if (structureIds.length === 0) {
    return null;
  }

  const [
    structures,
    typologies,
    adresses,
    adresseTypologies,
    cpomLinks,
    dnaLinks,
  ] = await Promise.all([
    findStructuresWithTypes(structureIds),
    findStructureTypologies(structureIds),
    findStructureAdresses(structureIds),
    findAdresseTypologies(structureIds),
    findCpomStructures(structureIds),
    findDnaLinksByStructure(structureIds),
  ]);

  const dnaCodes = [...new Set(dnaLinks.map((link) => link.dna.code))];

  const deptNumeros = [
    ...new Set(
      structures
        .map((structure) => structure.departementAdministratif)
        .filter((departement): departement is string => departement !== null)
    ),
  ];
  const departements = await findDepartementsWithPopulation(deptNumeros);

  return {
    structureIds,
    structures,
    typologies,
    adresses,
    adresseTypologies,
    cpomLinks,
    dnaLinks,
    dnaCodes,
    departements,
  };
};
