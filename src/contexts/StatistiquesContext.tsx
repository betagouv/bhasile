"use client";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue } =
  createEntityContext<StatistiqueApiRead>("Statistiques");

export const StatistiquesProvider = Provider;

export const useStatistiquesContext = () => {
  const { entity } = useValue();

  return { statistiques: entity };
};
