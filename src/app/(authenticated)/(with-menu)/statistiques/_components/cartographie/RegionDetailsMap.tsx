"use client";

import { useMemo } from "react";

import { useMapLabels } from "@/app/hooks/useMapLabels";
import { ZoneDataInfo } from "@/types/map.type";

import { richRecordToValueRecord } from "./cartographie.util";
import { ZoneIndicator } from "./ZoneIndicator";

export const RegionDetailsMap = ({ regionCode, zoneData }: Props) => {
  const valueRecord = useMemo(
    () => richRecordToValueRecord(zoneData),
    [zoneData]
  );

  const { containerRef, mapRef, labels } = useMapLabels({
    zoneData,
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
        data={JSON.stringify(valueRecord)}
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
  zoneData: Record<string, ZoneDataInfo>;
};
