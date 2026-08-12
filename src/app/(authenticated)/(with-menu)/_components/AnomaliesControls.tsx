"use client";

import { Select } from "@codegouvfr/react-dsfr/Select";
import { ReactElement } from "react";

import { useDashboardParams } from "@/app/hooks/useDashboardParams";
import { AnomalieGroupBy } from "@/types/dashboard.type";

export const AnomaliesControls = ({
  groupBy,
  shouldShowIgnored,
}: Props): ReactElement => {
  const { isPending, setParams } = useDashboardParams();

  return (
    <div
      className={`flex items-center gap-8 ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <button
        type="button"
        aria-pressed={shouldShowIgnored}
        onClick={() =>
          setParams({
            anomaliesIgnorees: shouldShowIgnored ? "0" : "1",
            anomaliesPage: "0",
          })
        }
        className="flex items-center gap-2 pb-1 text-sm font-bold text-title-blue-france"
      >
        <span className="fr-icon-eye-line fr-icon--sm" aria-hidden="true" />
        {shouldShowIgnored ? "Masquer" : "Voir"} les anomalies ignorées
      </button>

      <Select
        label="Groupé par"
        nativeSelectProps={{
          value: groupBy,
          onChange: (event) =>
            setParams({
              anomaliesGroupe: event.target.value,
              anomaliesPage: "0",
            }),
        }}
        className="mb-0 flex items-center gap-2 [&_select]:mt-0 [&_label]:uppercase [&_label]:whitespace-nowrap"
      >
        {ANOMALIE_GROUP_BY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
};

const ANOMALIE_GROUP_BY_OPTIONS: { value: AnomalieGroupBy; label: string }[] = [
  { value: "STRUCTURE", label: "Structure" },
  { value: "CODE", label: "Anomalie" },
];

type Props = {
  groupBy: AnomalieGroupBy;
  shouldShowIgnored: boolean;
};
