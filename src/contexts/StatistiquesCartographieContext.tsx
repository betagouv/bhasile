"use client";

import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";

import { createEntityContext } from "./createEntityContext";

const { Provider, useValue } =
  createEntityContext<CartographieApiRead>("StatistiquesCartographie");

export const StatistiquesCartographieProvider = Provider;

export const useStatistiquesCartographieContext = () => {
  const { entity } = useValue();

  return { statistiques: entity };
};
