import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import {
  computeTotalPlaces,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
} from "../shared/utils";
import { findEigs, findEvaluations } from "./controle-qualite.repository";
import {
  computeEigByMonth,
  computeEigSummary,
  computeEvaluationsByMonth,
  computeEvaluationSummary,
} from "./controle-qualite.util";

export const getControleQualiteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["controleQualite"]> => {
  const { structureIds, structures, typologies, dnaLinks, dnaCodes } = context;

  const typologieMap = getLastTypologiePerStructure(typologies);
  const activeStructures = filterStructuresWithTypologie(structures, typologieMap);
  const totalPlaces = computeTotalPlaces(activeStructures, typologieMap);

  const [eigs, evaluations] = await Promise.all([
    findEigs(dnaCodes),
    findEvaluations(structureIds),
  ]);

  const eigByMonth = computeEigByMonth(eigs);
  const eig = computeEigSummary(
    eigByMonth,
    eigs,
    dnaLinks,
    structureIds,
    totalPlaces
  );

  return {
    eig,
    eigByMonth,
    evaluations: {
      summary: computeEvaluationSummary(evaluations),
      byMonth: computeEvaluationsByMonth(evaluations),
    },
  };
};
