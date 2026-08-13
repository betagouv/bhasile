"use client";

import { ReactElement } from "react";

import { useAnomalies } from "@/app/components/forms/AnomaliesContext";
import { formatAnomalieLabel } from "@/app/utils/anomalie.util";

export const AnomalieMessage = ({
  fields,
  targetIds,
  details,
}: Props): ReactElement => {
  const anomalies = useAnomalies({ fields, targetIds });

  return (
    <div
      role="status"
      className={
        anomalies.length > 0
          ? "my-2 flex flex-col gap-1 text-sm text-default-warning"
          : "sr-only"
      }
    >
      {anomalies.map((anomalie) => (
        <p
          key={`${anomalie.code}-${anomalie.year}-${anomalie.targetId}`}
          className="mb-0"
        >
          {formatAnomalieLabel(anomalie)}
          {details && ` (${details})`}
        </p>
      ))}
    </div>
  );
};

type Props = {
  fields: readonly string[];
  targetIds?: readonly number[];
  details?: string;
};
