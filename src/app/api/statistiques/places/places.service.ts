import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import { computePlacesStatistiques } from "./places.util";

export const getPlacesStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["places"] => computePlacesStatistiques(context);
