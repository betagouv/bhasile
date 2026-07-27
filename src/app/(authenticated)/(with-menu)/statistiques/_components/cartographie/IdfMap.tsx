"use client";

import { useEffect, useRef, useState } from "react";

import { ZoneLabel } from "@/types/map.type";

import { ZoneIndicator } from "./ZoneIndicator";

const OFFSETS: Record<string, { offsetX: number; offsetY: number }> = {
  "75": { offsetX: -40, offsetY: -40 },
  "92": { offsetX: -60, offsetY: 10 },
  "93": { offsetX: 40, offsetY: -30 },
  "94": { offsetX: 40, offsetY: 30 },
};

export const IdfMap = ({ zoneData }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const [labels, setLabels] = useState<ZoneLabel[]>([]);

  useEffect(() => {
    const calculatePositions = () => {
      if (!mapRef.current || !containerRef.current) {
        return;
      }
      const root = mapRef.current.shadowRoot || mapRef.current;
      const paths = root.querySelectorAll<SVGPathElement>("path");

      if (paths.length === 0) {
        requestAnimationFrame(calculatePositions);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLabels: ZoneLabel[] = [];

      paths.forEach((path) => {
        const className = path.getAttribute("class") || "";
        const frClass = className
          .split(" ")
          .find((classname) => classname.startsWith("FR-"));

        if (frClass) {
          const code = frClass.replace("FR-", "");
          const value = zoneData[code];

          if (value !== undefined) {
            const rect = path.getBoundingClientRect();
            newLabels.push({
              code,
              value,
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height / 2,
            });
          }
        }
      });
      setLabels(newLabels);
    };

    const timeoutId = setTimeout(calculatePositions, 300);
    return () => clearTimeout(timeoutId);
  }, [zoneData]);

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
          />
        );
      })}
    </div>
  );
};

type Props = { zoneData: Record<string, number> };
