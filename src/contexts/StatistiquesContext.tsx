"use client";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue } = createEntityContext<StatistiqueApiRead | null>(
  "Statistiques"
);

export const StatistiquesProvider = Provider;

export const useOptionalStatistiquesContext = () => {
  const { entity } = useValue();

  return { statistiques: entity };
};

export const useStatistiquesContext = () => {
  const { statistiques } = useOptionalStatistiquesContext();

  if (!statistiques) {
    throw new Error("Aucune statistique pour ce périmètre");
  }

  return { statistiques };
};
