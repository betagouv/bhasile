"use client";

import { ReactElement } from "react";

import { useSectionAnomalies } from "@/app/components/forms/AnomaliesContext";
import { getAnomalieMessage } from "@/app/utils/anomalie.util";

export const ANOMALIE_INPUT_BORDER =
  "[&_input]:border-1 [&_input]:border-solid [&_input]:border-plain-warning [&_input]:shadow-none";

export const AnomalieMessage = ({
  id,
  fields,
  targetIds,
}: Props): ReactElement | null => {
  const anomalies = useSectionAnomalies({ fields, targetIds });
  const message = getAnomalieMessage(anomalies);

  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="status"
      className="mt-2 text-sm text-default-warning flex items-center gap-2"
    >
      {message}
    </p>
  );
};

type Props = {
  id: string;
  fields: readonly string[];
  targetIds?: readonly number[];
};
