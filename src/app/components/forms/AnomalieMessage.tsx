"use client";

import { ReactElement } from "react";

import { useAnomalies } from "@/app/components/forms/AnomaliesContext";
import { getGroupedAnomalieLabels } from "@/app/utils/anomalie.util";

export const AnomalieMessage = ({
  fields,
  targetIds,
  details,
}: Props): ReactElement => {
  const anomalies = useAnomalies({ fields, targetIds });
  const messages = getGroupedAnomalieLabels(anomalies);

  return (
    <div
      role="status"
      className={
        messages.length > 0
          ? "my-2 flex flex-col gap-1 text-sm text-default-warning"
          : "sr-only"
      }
    >
      {messages.map((message) => (
        <p key={message} className="mb-0">
          {message}
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
