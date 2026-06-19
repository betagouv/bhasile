import { NumericAggregation } from "@/app/utils/math.util";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/shared.service";
import {
  computeTotalPlaces,
  filterStructuresActives,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
} from "../shared/shared.utils";
import { findEigs, findEvaluations } from "./controle-qualite.repository";
import { computeControleQualiteStatistiques } from "./controle-qualite.util";

export const getControleQualiteStatistiques = async (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): Promise<StatistiqueApiRead["controleQualite"]> => {
  const { structureIds, structures, typologies, dnaLinks, dnaCodes } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structuresWithTypologie = filterStructuresWithTypologie(
    filterStructuresActives(structures),
    typologieMap
  );

  const [eigs, evaluations] = await Promise.all([
    findEigs(dnaCodes),
    findEvaluations(structureIds),
  ]);

  return computeControleQualiteStatistiques(
    structuresWithTypologie.map((structure) => structure.id),
    computeTotalPlaces(structuresWithTypologie, typologieMap),
    eigs,
    evaluations,
    dnaLinks,
    aggregation
  );
};
