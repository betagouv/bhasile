"use client";

import "../../../node_modules/@gouvfr/dsfr-chart/dist/MapChart/MapChart.css";

import { useEffect, useRef, useState } from "react";

import { DecoupageSelector } from "../(authenticated)/(with-menu)/stats/_components/cartographie/DecoupageSelector";
import { MoyenneIndicator } from "../(authenticated)/(with-menu)/stats/_components/cartographie/MoyenneIndicator";
import { YearSelector } from "../(authenticated)/(with-menu)/stats/_components/cartographie/YearSelector";
import { ZoneIndicator } from "../(authenticated)/(with-menu)/stats/_components/cartographie/ZoneIndicator";
import { MapLegend } from "./MapLegend";

type ZoneLabel = {
  code: string;
  value: number;
  x: number;
  y: number;
};

export default function DsfrMap({ zoneData }: Props) {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [zoneLables, setZoneLabels] = useState<ZoneLabel[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("@gouvfr/dsfr-chart")
      .then(() => {
        setIsLibraryLoaded(true);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement de dsfr-chart:", error);
      });
  }, []);

  useEffect(() => {
    if (!isLibraryLoaded) {
      return;
    }

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
        const frClass = (className as string)
          .split(" ")
          .find((className) => className.startsWith("FR-"));

        if (frClass) {
          const regionCode = frClass.replace("FR-", "");
          if (regionCode === "20R") {
            return;
          }
          const value = zoneData[regionCode];

          if (value !== undefined) {
            const pathRect = path.getBoundingClientRect();

            const x = pathRect.left - containerRect.left + pathRect.width / 2;
            const y = pathRect.top - containerRect.top + pathRect.height / 2;

            newLabels.push({
              code: regionCode,
              value: value,
              x,
              y,
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
  }, [isLibraryLoaded, zoneData]);

  if (!isLibraryLoaded) {
    return <div>Chargement de la carte...</div>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="flex flex-col absolute top-4 left-4">
        <div className="flex items-center pb-4 z-10">
          <div className="pr-4">
            <YearSelector />
          </div>
          <DecoupageSelector />
        </div>
        {/* TODO : mettre des vraies valeurs ici */}
        <MoyenneIndicator value={42} trend="up" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <MapLegend zoneData={zoneData} />
      </div>
      {/* @ts-expect-error Next n'arrive pas à détecter la déclaration de dsfr-chart.d.ts */}
      <map-chart
        ref={mapRef}
        data={JSON.stringify(zoneData)}
        name="Moyenne"
        level="reg"
        className="w-full h-full max-w-[90%] max-h-[85%] [&>div]:w-full [&>div]:h-full [&>div]:flex [&>div]:items-center [&>div]:justify-center [&_svg]:max-w-full [&_svg]:max-h-full"
      />

      {zoneLables.map((label) => (
        <ZoneIndicator
          key={label.code}
          value={label.value}
          x={label.x}
          y={label.y}
        />
      ))}
    </div>
  );
}

type Props = {
  zoneData: Record<string, number>;
};
