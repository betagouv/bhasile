"use client";

import { useMemo } from "react";

import { useMapLabels } from "@/app/hooks/useMapLabels";

import { useStatistiquesCartographieContext } from "../../_context/StatistiquesCartographieClientContext";
import { ZoneIndicator } from "./ZoneIndicator";

export const RegionDetailsMap = ({
  regionCode,
  zoneData,
  evolutionData,
}: Props) => {
  const { statistiques } = useStatistiquesCartographieContext();
  const zones = useMemo(() => statistiques?.zones || [], [statistiques?.zones]);

  const richZoneData = useMemo(() => {
    return Object.keys(zoneData).reduce(
      (accumulator, code) => {
        const localEvolution = evolutionData?.[code];
        const matchingZone = zones.find(
          (zone) => zone.code.replace(/^FR-/, "") === code
        );

        accumulator[code] = {
          value: zoneData[code],
          delta: localEvolution?.delta ?? matchingZone?.evolution?.delta,
          direction:
            localEvolution?.direction ?? matchingZone?.evolution?.direction,
        };
        return accumulator;
      },
      {} as Record<
        string,
        { value: number; delta?: number; direction?: string | null }
      >
    );
  }, [zoneData, evolutionData, zones]);
  const { containerRef, mapRef, labels } = useMapLabels({
    zoneData: richZoneData,
    dependencyTrigger: regionCode,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex justify-center items-center"
      onClickCapture={(event) => {
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      {/* @ts-expect-error Next n'arrive pas à détecter la déclaration de dsfr-chart.d.ts */}
      <map-chart-reg
        key={regionCode}
        ref={mapRef}
        data={JSON.stringify(zoneData)}
        region={regionCode}
        name={`Moyenne ${regionCode}`}
        className="w-full h-full max-w-[80%] max-h-[80%] [&>div]:w-full [&>div]:h-full [&>div]:flex [&>div]:items-center [&>div]:justify-center [&_svg]:max-w-full [&_svg]:max-h-full"
      />

      {labels.map((label) => (
        <ZoneIndicator
          key={label.code}
          value={label.value}
          x={label.x}
          y={label.y}
          delta={label.delta}
          direction={label.direction}
        />
      ))}
    </div>
  );
};

type Props = {
  regionCode: string;
  zoneData: Record<string, number>;
  evolutionData?: Record<string, { delta?: number; direction?: string | null }>;
};
