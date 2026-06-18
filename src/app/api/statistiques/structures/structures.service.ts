import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import { computeStructuresStatistiques } from "./structures.util";

export const getStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => {
  const { structures, typologies, adresses, cpomLinks } = context;

  return computeStructuresStatistiques(
    structures,
    typologies,
    adresses,
    cpomLinks
  );
};
