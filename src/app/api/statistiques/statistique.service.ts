import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  StatistiqueApiRead,
  StatistiquesFilters,
} from "@/schemas/api/statistique.schema";

import { getActiviteStatistiques } from "./activite/activite.service";
import { getControleQualiteStatistiques } from "./controle-qualite/controle-qualite.service";
import { getFinanceStatistiques } from "./finance/finance.service";
import { getPlacesStatistiques } from "./places/places.service";
import type { StatistiquesContext } from "./statistiques.db.type";
import {
  findCpomStructures,
  findDepartementsWithPopulation,
  findDnaLinksByStructure,
  findStructureAdresses,
  findStructureIds,
  findStructuresWithTypes,
  findStructureTypologies,
} from "./statistiques.repository";
import { getStructuresStatistiques } from "./structures/structures.service";

const buildStructureWhere = async (
  filters: StatistiquesFilters
): Promise<Prisma.StructureWhereInput> => {
  // TODO(structure-version): filtrer type/département sur version effective (typologie.utils)
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
  filters: StatistiquesFilters
): Promise<StatistiquesContext | null> => {
  const where = await buildStructureWhere(filters);
  const structureIds = await findStructureIds(where);

  if (structureIds.length === 0) {
    return null;
  }

  const [structures, typologies, adresses, cpomLinks, dnaLinks] =
    await Promise.all([
      findStructuresWithTypes(structureIds),
      findStructureTypologies(structureIds),
      findStructureAdresses(structureIds),
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
    cpomLinks,
    dnaLinks,
    dnaCodes,
    departements,
  };
};

export const getStatistiques = async (
  filters: StatistiquesFilters
): Promise<StatistiqueApiRead | null> => {
  const context = await buildStatistiquesContext(filters);
  if (!context) {
    return null;
  }

  const { aggregation } = filters;

  const [structures, places, finance, controleQualite, activite] =
    await Promise.all([
      getStructuresStatistiques(context),
      getPlacesStatistiques(context),
      getFinanceStatistiques(context, aggregation),
      getControleQualiteStatistiques(context, aggregation),
      getActiviteStatistiques(context),
    ]);

  return {
    structures,
    places,
    finance,
    controleQualite,
    activite,
  };
};
