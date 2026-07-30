"use client";

import { useMapLabels } from "@/app/hooks/useMapLabels";

import { useCartographieRichZoneData } from "./useCartographieRichZoneData";
import { ZoneIndicator } from "./ZoneIndicator";

const OFFSETS: Record<string, { offsetX: number; offsetY: number }> = {
  "75": { offsetX: -40, offsetY: -40 },
  "92": { offsetX: -60, offsetY: 10 },
  "93": { offsetX: 40, offsetY: -30 },
  "94": { offsetX: 40, offsetY: 30 },
};

export const IdfMap = ({ zoneData }: Props) => {
  const richZoneData = useCartographieRichZoneData();

  const { containerRef, mapRef, labels } = useMapLabels({
    zoneData: richZoneData,
  });

  return (
    <div ref={containerRef} className="relative w-48 h-48">
      <div
        onClickCapture={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        {/* @ts-expect-error Next n'arrive pas à détecter la déclaration de dsfr-chart.d.ts */}
        <map-chart-reg
          ref={mapRef}
          data={JSON.stringify(zoneData)}
          region="IDF"
          level="dep"
          className="w-full h-full drop-shadow-md"
        />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {labels.map((label) => {
          const offset = OFFSETS[label.code];
          if (!offset) {
            return null;
          }
          return (
            <line
              key={`line-${label.code}`}
              x1={label.x}
              y1={label.y}
              x2={label.x + offset.offsetX}
              y2={label.y + offset.offsetY}
              stroke="gray"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {labels.map((label) => {
        const offset = OFFSETS[label.code] || { offsetX: 0, offsetY: 0 };
        return (
          <ZoneIndicator
            key={label.code}
            value={label.value}
            x={label.x + offset.offsetX}
            y={label.y + offset.offsetY}
            delta={label.delta}
            direction={label.direction}
          />
        );
      })}
    </div>
  );
};

type Props = { zoneData: Record<string, number> };
