"use client";

import { useMemo } from "react";

import { useStatistiquesCartographieContext } from "@/contexts/StatistiquesCartographieContext";
import { ZoneDataInfo } from "@/types/map.type";

import { zonesToRichRecord } from "./cartographie.util";

export const useCartographieRichZoneData = (): Record<string, ZoneDataInfo> => {
  const { statistiques } = useStatistiquesCartographieContext();
  return useMemo(
    () => zonesToRichRecord(statistiques.zones),
    [statistiques.zones]
  );
};
