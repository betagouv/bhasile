import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import { computeStructuresStatistiques } from "./structures.util";

export const getStructuresStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["structures"] => computeStructuresStatistiques(context);
