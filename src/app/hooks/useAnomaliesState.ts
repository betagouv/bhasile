"use client";

import { useCallback, useEffect, useState } from "react";

import { getNow } from "@/app/utils/now.util";
import { useOptionalStructure } from "@/contexts/StructureContext";
import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import { ANOMALIE_DEFINITIONS } from "@/lib/anomalies/anomalie.definition";
import { buildFormAnomalieContext } from "@/lib/anomalies/anomalie.form";
import type { DetectedAnomalie } from "@/lib/anomalies/anomalie.rule";
import { StructureApiRead } from "@/schemas/api/structure.schema";

export const useAnomaliesState = (
  getFormValues: () => Record<string, unknown>
): { anomalies: DetectedAnomalie[]; recomputeAnomalies: () => void } => {
  const structure = useOptionalStructure();
  const [anomalies, setAnomalies] = useState<DetectedAnomalie[]>([]);

  const recomputeAnomalies = useCallback(() => {
    if (!structure) {
      return;
    }

    const { detected } = computeAnomalies(
      buildFormAnomalieContext({
        ...structure,
        ...getFormValues(),
      } as StructureApiRead),
      { currentYear: getNow().getFullYear() }
    );

    const displayed = detected.filter(
      (anomalie) =>
        ANOMALIE_DEFINITIONS[anomalie.code].isDisplayed &&
        !isJustified(anomalie, structure)
    );

    setAnomalies((previous) =>
      JSON.stringify(previous) === JSON.stringify(displayed)
        ? previous
        : displayed
    );
  }, [structure, getFormValues]);

  useEffect(() => {
    recomputeAnomalies();
  }, [recomputeAnomalies]);

  return { anomalies, recomputeAnomalies };
};

const isJustified = (
  anomalie: DetectedAnomalie,
  structure: StructureApiRead
): boolean =>
  structure.anomalies.some(
    (justified) =>
      justified.code === anomalie.code &&
      justified.year === anomalie.year &&
      justified.targetId === anomalie.targetId
  );
