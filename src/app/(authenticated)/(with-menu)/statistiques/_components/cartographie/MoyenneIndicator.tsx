"use client";

import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";

import { useStatistiquesCartographieContext } from "../../_context/StatistiquesCartographieClientContext";

export const MoyenneIndicator = ({ selectedRegion }: Props): ReactElement => {
  const { statistiques } = useStatistiquesCartographieContext();
  const zones = statistiques?.zones || [];

  if (zones.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="uppercase text-xs font-bold text-mention-grey">
          Moyenne
        </span>
        <div className="bg-white rounded-full px-4 py-2 w-fit text-sm text-mention-grey">
          —
        </div>
      </div>
    );
  }

  const selectedZone = selectedRegion
    ? zones.find((z) => z.code.replace(/^FR-/, "") === selectedRegion)
    : null;

  let displayValue = 0;
  let displayDelta = 0;

  if (selectedZone) {
    displayValue = selectedZone.value ?? 0;

    const previous =
      selectedZone.evolution?.previousValue ?? selectedZone.value ?? 0;
    displayDelta = displayValue - previous;
  } else {
    const totalCurrent = zones.reduce(
      (sum, zone) => sum + (zone.value ?? 0),
      0
    );
    displayValue = totalCurrent / zones.length;

    const totalPrevious = zones.reduce((sum, zone) => {
      const previous = zone.evolution?.previousValue ?? zone.value ?? 0;
      return sum + previous;
    }, 0);
    const averagePrevious = totalPrevious / zones.length;

    displayDelta = displayValue - averagePrevious;
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="uppercase text-xs font-bold text-mention-grey">
        {selectedZone ? "Valeur régionale" : "Moyenne"}
      </span>
      <div className="bg-white rounded-full px-4 py-2 w-fit text-sm flex items-center gap-2 font-medium">
        <NumberDisplay value={displayValue} />
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
