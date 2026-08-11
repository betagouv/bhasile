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

export const useFieldAnomalies = ({
  field,
  year,
  targetId,
}: {
  field: string;
  year?: number;
  targetId?: number;
}): DetectedAnomalie[] => {
  const anomalies = useContext(AnomaliesContext);

  return anomalies.filter(
    (anomalie) =>
      ANOMALIE_DEFINITIONS[anomalie.code].targetFields.includes(field) &&
      (year === undefined || anomalie.year === year) &&
      (targetId === undefined || anomalie.targetId === targetId)
  );
};

/**
 * Les champs sont ceux que le composant rend, dérivés de la définition de son
 * tableau : on signale l'anomalie là où l'agent peut la corriger, pas là où le
 * registre l'a classée.
 */
export const useSectionAnomalies = (
  fields: readonly string[]
): DetectedAnomalie[] => {
  const anomalies = useContext(AnomaliesContext);

  return anomalies.filter((anomalie) =>
    ANOMALIE_DEFINITIONS[anomalie.code].targetFields.some((targetField) =>
      fields.includes(targetField)
    )
  );
};
