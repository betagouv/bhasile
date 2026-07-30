"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";
import { ZoneDataInfo } from "@/types/map.type";

import { useStatistiquesCartographieContext } from "../../_context/StatistiquesCartographieClientContext";
import {
  getDepartementNumerosForRegion,
  zonesToRichRecord,
  zonesToValueRecord,
} from "./cartographie.util";
import { MapLayout } from "./MapLayout";

export const FranceMap = (): ReactElement => {
  const { statistiques } = useStatistiquesCartographieContext();
  const searchParams = useSearchParams();

  const decoupage =
    searchParams.get("granularite") === "departement" ? "dep" : "reg";

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [departementsData, setDepartementsData] = useState<
    Record<string, ZoneDataInfo>
  >({});
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  const zoneData = useMemo(
    () => zonesToValueRecord(statistiques.zones),
    [statistiques.zones]
  );

  useEffect(() => {
    if (!selectedRegion) {
      setDepartementsData({});
      setRegionError(null);
      return;
    }

    let cancelled = false;

    const fetchRegionDepartements = async () => {
      setIsLoadingRegion(true);
      setRegionError(null);
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set("granularite", "departement");
        params.set("annee", statistiques.annee.toString());
        params.set("indicateur", statistiques.indicateur);

        const regionNumeros = getDepartementNumerosForRegion(selectedRegion);
        const activeDepartements = params
          .get("departements")
          ?.split(",")
          .filter(Boolean);
        const scopedNumeros =
          activeDepartements && activeDepartements.length > 0
            ? regionNumeros.filter((numero) =>
                activeDepartements.includes(numero)
              )
            : regionNumeros;
        params.set("departements", scopedNumeros.join(","));

        const response = await fetch(
          `/api/statistiques/cartographie?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des départements");
        }

        const data: CartographieApiRead = await response.json();
        if (!cancelled) {
          setDepartementsData(zonesToRichRecord(data.zones));
        }
      } catch (error) {
        console.error("Erreur cartographie :", error);
        if (!cancelled) {
          setDepartementsData({});
          setRegionError("Impossible de charger le détail de la région.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRegion(false);
        }
      }
    };

    fetchRegionDepartements();

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, searchParams, statistiques]);

  return (
    <MapLayout
      zoneData={zoneData}
      departementsData={departementsData}
      decoupage={decoupage}
      selectedRegion={selectedRegion}
      setSelectedRegion={setSelectedRegion}
      isLoadingRegion={isLoadingRegion}
      regionError={regionError}
    />
  );
};
