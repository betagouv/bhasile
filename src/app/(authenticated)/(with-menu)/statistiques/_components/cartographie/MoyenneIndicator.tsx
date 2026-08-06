"use client";

import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { average } from "@/app/utils/math.util";
import { useStatistiquesCartographieContext } from "@/contexts/StatistiquesCartographieContext";

import { cleanZoneCode } from "./cartographie.util";

export const MoyenneIndicator = ({ selectedRegion }: Props): ReactElement => {
  const { statistiques } = useStatistiquesCartographieContext();
  const zones = statistiques.zones;

  const selectedZone = selectedRegion
    ? zones.find((zone) => cleanZoneCode(zone.code) === selectedRegion)
    : null;

  let displayValue: number | null;
  let displayDelta = 0;

  if (selectedZone) {
    displayValue = selectedZone.value;
    const previous = selectedZone.evolution?.previousValue ?? selectedZone.value;
    displayDelta = (selectedZone.value ?? 0) - (previous ?? 0);
  } else {
    displayValue = average(zones.map((zone) => zone.value));
    const zoneDeltas = zones.map((zone) => {
      const previous = zone.evolution?.previousValue;
      return zone.value !== null && previous !== undefined
        ? zone.value - previous
        : null;
    });
    displayDelta = average(zoneDeltas) ?? 0;
  }

  if (displayValue === null) {
    return (
      <div className="flex flex-col gap-2">
        <span className="uppercase text-xs font-bold text-mention-grey">
          {selectedZone ? "Valeur régionale" : "Moyenne"}
        </span>
        <div className="bg-white rounded-full px-4 py-2 w-fit text-sm text-mention-grey">
          —
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="uppercase text-xs font-bold text-mention-grey">
        {selectedZone ? "Valeur régionale" : "Moyenne"}
      </span>
      <div className="bg-white rounded-full px-4 py-2 w-fit text-sm flex items-center gap-2 font-medium">
        <NumberDisplay value={displayValue} compact />
        {displayDelta > 0 && (
          <span
            className="fr-icon-arrow-up-line text-title-blue-france"
            aria-hidden="true"
          />
        )}
        {displayDelta < 0 && (
          <span
            className="fr-icon-arrow-down-line text-title-blue-france"
            aria-hidden="true"
          />
        )}
        {Math.abs(displayDelta) < 0.001 && (
          <span className="text-mention-grey font-bold" aria-hidden="true">
            —
          </span>
        )}
      </div>
    </div>
  );
};

type Props = {
  selectedRegion?: string | null;
};
