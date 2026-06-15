import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import { getLastTypologiePerStructure } from "../shared/typologie.util";
import { computeTotalPlaces } from "../places/places.util";
import { findEigs, findEvaluations } from "./controle-qualite.repository";
import {
  computeEigByMonth,
  computeEigSummary,
  computeEvaluationsByMonth,
  computeEvaluationSummary,
  emptyEvaluationStat,
} from "./controle-qualite.util";

export const getControleQualiteStatistiques = async (
  context: StatistiquesContext
): Promise<StatistiqueApiRead["controleQualite"]> => {
  const { structureIds, structures, typologies, dnaLinks, dnaCodes } = context;

  const typologieMap = getLastTypologiePerStructure(typologies);
  const totalPlaces = computeTotalPlaces(structures, typologieMap);

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

export const emptyControleQualiteStatistiques =
  (): StatistiqueApiRead["controleQualite"] => ({
    eig: {
      pour1000PlacesSur12Mois: null,
      tauxComportementViolent: null,
      nbComportementViolent: 0,
      nbAutres: 0,
      nbStructuresSansDeclaration: 0,
    },
    eigByMonth: [],
    evaluations: {
      summary: emptyEvaluationStat(),
      byMonth: [],
    },
  });
