"use client";

import "../../../../../../../node_modules/@gouvfr/dsfr-chart/dist/MapChart/MapChart.css";

import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect, useState } from "react";

import { DecoupageSelector } from "./DecoupageSelector";
import { IdfMap } from "./IdfMap";
import { MainMap } from "./MainMap";
import { MapLegend } from "./MapLegend";
import { MoyenneIndicator } from "./MoyenneIndicator";
import { RegionDetailsMap } from "./RegionDetailsMap";
import { YearSelector } from "./YearSelector";

export const MapLayout = ({
  zoneData,
  departementsData,
  decoupage,
  setDecoupage,
}: Props) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    if (decoupage === "dep") {
      setSelectedRegion(null);
    }
  }, [decoupage]);

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-col absolute top-4 left-4 z-20">
        <div className="flex items-end pb-4">
          <div className="pr-4">
            <YearSelector />
          </div>
          <DecoupageSelector
            decoupage={decoupage}
            setDecoupage={setDecoupage}
          />
          {decoupage === "reg" && selectedRegion && (
            <Button
              className="ml-4 underline font-normal"
              priority="tertiary no outline"
              iconId="fr-icon-arrow-left-line"
              onClick={() => setSelectedRegion(null)}
            >
              Toute la France
            </Button>
          )}
        </div>
        {/* TODO : mettre des vraies valeurs ici */}
        <MoyenneIndicator value={42} trend="up" />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <MapLegend zoneData={zoneData} />
      </div>

      {decoupage === "reg" && selectedRegion ? (
        <RegionDetailsMap
          regionCode={selectedRegion}
          zoneData={departementsData}
        />
      ) : (
        <>
          {decoupage === "dep" && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
              <IdfMap zoneData={zoneData} />
            </div>
          )}

          <MainMap
            zoneData={zoneData}
            decoupage={decoupage}
            onRegionClick={decoupage === "reg" ? setSelectedRegion : undefined}
          />
        </>
      )}
    </div>
  );
};

type Props = {
  zoneData: Record<string, number>;
  departementsData: Record<string, number>;
  decoupage: "dep" | "reg";
  setDecoupage: (decoupage: "dep" | "reg") => void;
};
