import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import type { DetectedAnomalie } from "@/lib/anomalies/anomalie.rule";
import { ANOMALIE_NO_YEAR, AnomalieCode } from "@/types/anomalie.type";
import { DashboardAnomalie } from "@/types/dashboard.type";

import { pluralize } from "./string.util";

export const formatAnomalieLabel = (anomalie: {
  code: AnomalieCode;
  year: number;
}): string => formatAnomalieLabelForYears(anomalie.code, [anomalie.year]);

const formatAnomalieLabelForYears = (
  code: AnomalieCode,
  years: number[]
): string => {
  const { label } = ANOMALIE_DEFINITIONS[code];
  const exercices = [...new Set(years)]
    .filter((year) => year !== ANOMALIE_NO_YEAR)
    .sort();

  if (exercices.length === 0) {
    return label;
  }

  return `${label} (${pluralize(exercices.length, "exercice")} ${exercices.join(", ")})`;
};

export const getGroupedAnomalieLabels = (
  anomalies: DetectedAnomalie[]
): string[] => {
  const yearsByCode = new Map<AnomalieCode, number[]>();

  anomalies.forEach((anomalie) =>
    yearsByCode.set(anomalie.code, [
      ...(yearsByCode.get(anomalie.code) ?? []),
      anomalie.year,
    ])
  );

  return [...yearsByCode].map(([code, years]) =>
    formatAnomalieLabelForYears(code, years)
  );
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

export const ACTE_DATE_FIELDS = ["startDate", "endDate"] as const;

export const getAnomalieMessage = (
  anomalies: DetectedAnomalie[]
): string | undefined =>
  getGroupedAnomalieLabels(anomalies).join(" — ") || undefined;
