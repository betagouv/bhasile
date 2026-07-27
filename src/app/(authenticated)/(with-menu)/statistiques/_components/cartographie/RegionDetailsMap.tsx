"use client";

import { useEffect, useRef, useState } from "react";

import { ZoneIndicator } from "./ZoneIndicator";

type ZoneLabel = {
  code: string;
  value: number;
  x: number;
  y: number;
};

type Props = {
  regionCode: string;
  zoneData: Record<string, number>;
};

export const RegionDetailsMap = ({ regionCode, zoneData }: Props) => {
  const [zoneLabels, setZoneLabels] = useState<ZoneLabel[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const calculatePositions = () => {
      if (!mapRef.current || !containerRef.current) {
        return;
      }

      const root: ShadowRoot | HTMLElement =
        mapRef.current.shadowRoot || mapRef.current;
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
          .find((name) => name.startsWith("FR-"));

        if (frClass) {
          const depCode = frClass.replace("FR-", "");
          const value = zoneData[depCode];

          if (value !== undefined) {
            const pathRect = path.getBoundingClientRect();
            newLabels.push({
              code: depCode,
              value,
              x: pathRect.left - containerRect.left + pathRect.width / 2,
              y: pathRect.top - containerRect.top + pathRect.height / 2,
            });
          }
        }
      });

      setZoneLabels(newLabels);
    };

    const timeoutId = setTimeout(calculatePositions, 300);
    const resizeObserver = new ResizeObserver(() => calculatePositions());

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [regionCode, zoneData]);

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

      {zoneLabels.map((label) => (
        <ZoneIndicator
          key={label.code}
          value={label.value}
          x={label.x}
          y={label.y}
        />
      ))}
    </div>
  );
};
