import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { emptyBatis, emptyStructureTypes } from "../shared/aggregation.util";
import { StatistiquesContext } from "../shared/context";
import {
  computeGlobalStructuresStats,
  computeStructuresYearStats,
} from "./structures.util";

export const getStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => {
  const { nbCpoms, structures, typologies, adresses, cpomLinks } = context;

  const global = computeGlobalStructuresStats(
    structures,
    typologies,
    adresses,
    cpomLinks
  );
  const byYear = computeStructuresYearStats(
    structures,
    typologies,
    adresses,
    cpomLinks
  );

  return {
    totalStructures: global.totalStructures,
    totalCpoms: nbCpoms,
    structuresAvecCpom: global.structuresAvecCpom,
    structureTypes: global.structureTypes,
    structureBatis: global.structureBatis,
    byYear,
  };
};

export const emptyStructuresStatistiques =
  (): StatistiqueApiRead["structures"] => ({
    totalStructures: 0,
    totalCpoms: 0,
    structuresAvecCpom: 0,
    structureTypes: emptyStructureTypes(),
    structureBatis: emptyBatis(),
    byYear: [],
  });
