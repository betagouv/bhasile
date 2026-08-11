"use client";

import { ReactElement } from "react";

import { useSectionAnomalies } from "@/app/components/forms/AnomaliesContext";
import { getAnomalieMessage } from "@/app/utils/anomalie.util";

export const AnomalieMessage = ({ id, fields }: Props): ReactElement | null => {
  const anomalies = useSectionAnomalies(fields);
  const message = getAnomalieMessage(anomalies);

  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      role="status"
      className="mb-0 mt-2 text-sm text-default-warning flex items-center gap-2"
    >
      <span className="fr-icon-warning-line fr-icon--sm" aria-hidden="true" />
      {message}
    </p>
  );
};

type Props = {
  id: string;
  fields: readonly string[];
};
