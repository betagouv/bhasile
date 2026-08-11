import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import type { DetectedAnomalie } from "@/lib/anomalies/anomalie.rule";
import { ANOMALIE_NO_YEAR, AnomalieCode } from "@/types/anomalie.type";
import { DashboardAnomalie } from "@/types/dashboard.type";

export const formatAnomalieLabel = (anomalie: {
  code: AnomalieCode;
  year: number;
}): string => {
  const { label } = ANOMALIE_DEFINITIONS[anomalie.code];

  return anomalie.year === ANOMALIE_NO_YEAR
    ? label
    : `${label} (exercice ${anomalie.year})`;
};

export const formatAnomalieStructure = (anomalie: DashboardAnomalie): string =>
  [
    anomalie.structureCodeBhasile,
    anomalie.structureType,
    anomalie.operateurName,
    anomalie.structureCommune &&
      (anomalie.structureDepartement
        ? `${anomalie.structureCommune} (${anomalie.structureDepartement})`
        : anomalie.structureCommune),
  ]
    .filter(Boolean)
    .join(" · ");

export const ANOMALIE_MESSAGE_GENERIQUE =
  "Une ou plusieurs données sont manquantes ou incohérentes.";

export const getAnomalieMessage = (
  anomalies: DetectedAnomalie[]
): string | undefined => {
  if (anomalies.length === 0) {
    return undefined;
  }
  if (anomalies.length > 1) {
    return ANOMALIE_MESSAGE_GENERIQUE;
  }

  return formatAnomalieLabel(anomalies[0]);
};
