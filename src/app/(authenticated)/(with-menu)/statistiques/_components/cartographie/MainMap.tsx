"use client";

import { useEffect, useRef, useState } from "react";

import Loader from "@/app/components/ui/Loader";
import { ZoneLabel } from "@/types/map.type";

import { ZoneIndicator } from "./ZoneIndicator";

const IDF_DEPARTEMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"];

export const MainMap = ({ zoneData, decoupage, onRegionClick }: Props) => {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [zoneLabels, setZoneLabels] = useState<ZoneLabel[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("@gouvfr/dsfr-chart")
      .then(() => setIsLibraryLoaded(true))
      .catch((error) =>
        console.error("Erreur de chargement dsfr-chart :", error)
      );
  }, []);

  useEffect(() => {
    if (!isLibraryLoaded) {
      return;
    }

    const clickListeners: { element: SVGPathElement; handler: () => void }[] =
      [];

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
          .find((name) => name.startsWith("FR-"));

        if (frClass) {
          const code = frClass.replace("FR-", "");
          const value = zoneData[code];
          const isIdfDepartment =
            decoupage === "dep" && IDF_DEPARTEMENTS.includes(code);

          if (value !== undefined && !isIdfDepartment) {
            const pathRect = path.getBoundingClientRect();
            newLabels.push({
              code,
              value,
              x: pathRect.left - containerRect.left + pathRect.width / 2,
              y: pathRect.top - containerRect.top + pathRect.height / 2,
            });

            if (onRegionClick) {
              path.style.cursor = "pointer";
              path.classList.add("hover:opacity-80", "transition-opacity");

              const handler = () => onRegionClick(code);
              path.addEventListener("click", handler);
              clickListeners.push({ element: path, handler });
            }
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
      clickListeners.forEach(({ element, handler }) => {
        element.removeEventListener("click", handler);
      });
    };
  }, [isLibraryLoaded, zoneData, decoupage, onRegionClick]);

  if (!isLibraryLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClickCapture={(event) => {
        if (decoupage === "dep") {
          event.stopPropagation();
          event.preventDefault();
        }
      }}
    >
      {/* @ts-expect-error Next n'arrive pas à détecter la déclaration de dsfr-chart.d.ts */}
      <map-chart
        key={decoupage}
        ref={mapRef}
        data={JSON.stringify(zoneData)}
        name="Moyenne"
        level={decoupage}
        className="w-full h-full [&>div]:w-full [&>div]:h-full [&>div]:flex [&>div]:items-center [&>div]:justify-center"
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

type Props = {
  zoneData: Record<string, number>;
  decoupage: "dep" | "reg";
  onRegionClick?: (regionCode: string) => void;
};
