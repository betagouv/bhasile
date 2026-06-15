import { StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbAdresse,
  StatistiqueDbAdresseTypologie,
  StatistiqueDbCpomStructure,
  StatistiqueDbDepartement,
  StatistiqueDbDnaLink,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "./db.type";
import { buildStructureWhere } from "./filters";
import { StatistiquesPerimetreVideError } from "./errors";
import {
  findAdresseTypologies,
  findDepartementsWithPopulation,
  findDnaLinksByStructure,
  findStructureAdresses,
  findStructureIds,
  findStructuresWithTypes,
  findStructureTypologies,
} from "./repository";
import {
  countCpoms,
  findCpomStructures,
} from "../structures/structures.repository";

export type StatistiquesContext = {
  structureIds: number[];
  nbCpoms: number;
  structures: StatistiqueDbStructure[];
  typologies: StatistiqueDbTypologie[];
  adresses: StatistiqueDbAdresse[];
  adresseTypologies: StatistiqueDbAdresseTypologie[];
  cpomLinks: StatistiqueDbCpomStructure[];
  dnaLinks: StatistiqueDbDnaLink[];
  dnaCodes: string[];
  departements: StatistiqueDbDepartement[];
};

export const buildStatistiquesContext = async (
  filters: StatistiquesFiltersRaw
): Promise<StatistiquesContext> => {
  const where = await buildStructureWhere(filters);
  const structureIds = await findStructureIds(where);

  if (structureIds.length === 0) {
    throw new StatistiquesPerimetreVideError();
  }

  const [nbCpoms, structures, typologies, adresses, adresseTypologies, cpomLinks, dnaLinks] =
    await Promise.all([
      countCpoms(structureIds),
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
        .filter((dept): dept is string => dept !== null)
    ),
  ];
  const departements = await findDepartementsWithPopulation(deptNumeros);

  return {
    structureIds,
    nbCpoms,
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
