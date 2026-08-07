"use client";

import { Select } from "@codegouvfr/react-dsfr/Select";
import { ReactElement } from "react";

import { useDashboardParams } from "@/app/hooks/useDashboardParams";
import {
  RAPPEL_ECHELLE_OPTIONS,
  RAPPEL_GROUP_BY_OPTIONS,
  resolveRappelGroupBy,
} from "@/app/utils/rappel.util";
import { RappelEchelle, RappelGroupBy } from "@/types/dashboard.type";

export const RappelsControls = ({ echelle, groupBy }: Props): ReactElement => {
  const { isPending, setParams } = useDashboardParams();

  const handleEchelleChange = (nextEchelle: RappelEchelle): void => {
    setParams({
      rappelsEchelle: nextEchelle,
      rappelsGroupe: resolveRappelGroupBy(nextEchelle, groupBy),
      rappelsPage: "0",
    });
  };

  return (
    <div
      className={`flex items-end gap-8 ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <Select
        label="Échelle"
        nativeSelectProps={{
          value: echelle,
          onChange: (event) =>
            handleEchelleChange(event.target.value as RappelEchelle),
        }}
        className="mb-0 flex items-center gap-2 [&_select]:mt-0 [&_label]:uppercase [&_label]:whitespace-nowrap"
      >
        {RAPPEL_ECHELLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        label="Groupé par"
        nativeSelectProps={{
          value: groupBy,
          onChange: (event) =>
            setParams({
              rappelsGroupe: event.target.value,
              rappelsPage: "0",
            }),
        }}
        className="mb-0 flex items-center gap-2 [&_select]:mt-0 [&_label]:uppercase [&_label]:whitespace-nowrap"
      >
        {RAPPEL_GROUP_BY_OPTIONS[echelle].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
};

type Props = {
  echelle: RappelEchelle;
  groupBy: RappelGroupBy;
};
