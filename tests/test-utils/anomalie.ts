import { ANNEE_COURANTE_TEST } from "tests/test-utils/factories/anomalie-contexte.factory";

import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import type { AnomalieContexte } from "@/lib/anomalies/anomalie.contexte";
import type { AnomalieCode } from "@/types/anomalie.type";

export const detectionsDe = (
  code: AnomalieCode,
  contexte: AnomalieContexte,
  anneeCourante: number = ANNEE_COURANTE_TEST
): { year: number; targetId: number }[] =>
  computeAnomalies(contexte, { anneeCourante })
    .detectees.filter((detectee) => detectee.code === code)
    .map(({ year, targetId }) => ({ year, targetId }));
