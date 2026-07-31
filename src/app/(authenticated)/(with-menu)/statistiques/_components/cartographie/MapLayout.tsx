"use client";

import "../../../../../../../node_modules/@gouvfr/dsfr-chart/dist/MapChart/MapChart.css";

import Button from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";

import Loader from "@/app/components/ui/Loader";
import {
  DEFAULT_CARTOGRAPHIE_INDICATEUR,
  isSnapshotCartographieIndicateur,
} from "@/schemas/api/statistique-cartographie.schema";
import { ZoneDataInfo } from "@/types/map.type";

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
  selectedRegion,
  setSelectedRegion,
  isLoadingRegion,
  regionError,
}: Props) => {
  const searchParams = useSearchParams();
  const indicateur =
    searchParams.get("indicateur") ?? DEFAULT_CARTOGRAPHIE_INDICATEUR;
  const showYearSelector = !isSnapshotCartographieIndicateur(indicateur);

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-col absolute top-4 left-4 z-20">
        <div className="flex items-end pb-4">
          {showYearSelector && (
            <div className="pr-4">
              <YearSelector />
            </div>
          )}
          {/* Masqué à l'échelle d'une région tant qu'on n'a pas l'échelle arrondissement. */}
          {!(decoupage === "reg" && selectedRegion) && <DecoupageSelector />}
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
        <MoyenneIndicator selectedRegion={selectedRegion} />
      </div>

      <div className="absolute top-4 right-4 z-20">
        <MapLegend zoneData={zoneData} />
      </div>

      {decoupage === "reg" && selectedRegion ? (
        <div className="relative w-full h-full">
          {isLoadingRegion && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader />
            </div>
          )}
          {regionError && !isLoadingRegion && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-sm text-default-error font-medium">
                {regionError}
              </p>
            </div>
          )}
          <RegionDetailsMap
            regionCode={selectedRegion}
            zoneData={departementsData}
          />
        </div>
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
  departementsData: Record<string, ZoneDataInfo>;
  decoupage: "dep" | "reg";
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
  isLoadingRegion?: boolean;
  regionError?: string | null;
};
