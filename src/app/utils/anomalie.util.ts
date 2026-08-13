import { ANOMALIE_NO_YEAR } from "@/types/anomalie.type";
import { DashboardAnomalie } from "@/types/dashboard.type";

export const formatAnomalieLabel = (anomalie: DashboardAnomalie): string =>
  anomalie.year === ANOMALIE_NO_YEAR
    ? anomalie.label
    : `${anomalie.label} (exercice ${anomalie.year})`;

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
