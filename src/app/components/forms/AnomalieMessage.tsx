"use client";

import { ReactElement } from "react";

import { useAnomalies } from "@/app/components/forms/AnomaliesContext";
import { getAnomalieMessage } from "@/app/utils/anomalie.util";

export const AnomalieMessage = ({ fields, targetIds }: Props): ReactElement => {
  const anomalies = useAnomalies({ fields, targetIds });
  const message = getAnomalieMessage(anomalies);

  return (
    <p
      role="status"
      className={message ? "mt-2 text-sm text-default-warning" : "sr-only"}
    >
      {message}
    </p>
  );
};

type Props = {
  fields: readonly string[];
  targetIds?: readonly number[];
};
