"use client";

import { useMemo } from "react";

import { ZoneDataInfo } from "@/types/map.type";

import { useStatistiquesCartographieContext } from "../../_context/StatistiquesCartographieClientContext";
import { zonesToRichRecord } from "./cartographie.util";

export const useCartographieRichZoneData = (): Record<string, ZoneDataInfo> => {
  const { statistiques } = useStatistiquesCartographieContext();
  return useMemo(
    () => zonesToRichRecord(statistiques.zones),
    [statistiques.zones]
  );
};
