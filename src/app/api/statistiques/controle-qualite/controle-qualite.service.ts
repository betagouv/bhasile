import { NumericAggregation } from "@/app/utils/math.util";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
} from "../statistiques.utils";
import { findEigs, findEvaluations } from "./controle-qualite.repository";
import { computeControleQualiteStatistiques } from "./controle-qualite-evaluation.util";

export const getControleQualiteStatistiques = async (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): Promise<StatistiqueApiRead["controleQualite"]> => {
  const { structures, yearContext, typologies, dnaLinks, dnaCodes } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );

  const [eigs, evaluations] = await Promise.all([
    findEigs(dnaCodes),
    findEvaluations(yearContext.allStructureIds),
  ]);

  return computeControleQualiteStatistiques(
    structuresWithTypologie.map((structure) => structure.id),
    computeTotalPlaces(structuresWithTypologie, typologieMap),
    eigs,
    evaluations,
    dnaLinks,
    aggregation,
    yearContext
  );
};
