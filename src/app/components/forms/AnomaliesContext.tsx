"use client";

import { createContext, ReactNode, useContext } from "react";

import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import type { DetectedAnomalie } from "@/lib/anomalies/anomalie.rule";

const AnomaliesContext = createContext<DetectedAnomalie[]>([]);
AnomaliesContext.displayName = "AnomaliesContext";

export const AnomaliesProvider = ({
  anomalies,
  children,
}: {
  anomalies: DetectedAnomalie[];
  children: ReactNode;
}) => <AnomaliesContext value={anomalies}>{children}</AnomaliesContext>;

export const useAnomalies = ({
  fields,
  year,
  targetIds,
}: {
  fields: readonly string[];
  year?: number;
  targetIds?: readonly number[];
}): DetectedAnomalie[] => {
  const anomalies = useContext(AnomaliesContext);

  return anomalies.filter(
    (anomalie) =>
      ANOMALIE_DEFINITIONS[anomalie.code].targetFields.some((targetField) =>
        fields.includes(targetField)
      ) &&
      (year === undefined || anomalie.year === year) &&
      (targetIds === undefined || targetIds.includes(anomalie.targetId))
  );
};
