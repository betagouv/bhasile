"use client";

import { useCallback, useEffect, useState } from "react";

import Loader from "@/app/components/ui/Loader";
import { useMapLabels } from "@/app/hooks/useMapLabels";

import { useCartographieRichZoneData } from "./useCartographieRichZoneData";
import { ZoneIndicator } from "./ZoneIndicator";

const IDF_DEPARTEMENTS = ["75", "77", "78", "91", "92", "93", "94", "95"];

export const MainMap = ({ zoneData, decoupage, onRegionClick }: Props) => {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  const richZoneData = useCartographieRichZoneData();

  useEffect(() => {
    import("@gouvfr/dsfr-chart")
      .then(() => setIsLibraryLoaded(true))
      .catch((error) =>
        console.error("Erreur de chargement dsfr-chart :", error)
      );
  }, []);

  const handlePathFound = useCallback(
    (path: SVGPathElement, code: string) => {
      const isIdfDepartment =
        decoupage === "dep" && IDF_DEPARTEMENTS.includes(code);

      if (isIdfDepartment) {
        return false;
      }

      if (onRegionClick) {
        path.style.cursor = "pointer";
        path.classList.add("hover:opacity-80", "transition-opacity");

        const handler = () => onRegionClick(code);
        path.addEventListener("click", handler);
      }
      return true;
    },
    [decoupage, onRegionClick]
  );

  const { containerRef, mapRef, labels } = useMapLabels({
    zoneData: richZoneData,
    dependencyTrigger: decoupage,
    onPathFound: isLibraryLoaded ? handlePathFound : undefined,
  });

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
  zoneData: Record<string, number>;
  decoupage: "dep" | "reg";
  onRegionClick?: (regionCode: string) => void;
};
