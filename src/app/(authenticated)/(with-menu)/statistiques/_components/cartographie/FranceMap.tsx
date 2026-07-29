"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { useStatistiquesCartographieContext } from "../../_context/StatistiquesCartographieClientContext";
import { MapLayout } from "./MapLayout";

export const FranceMap = (): ReactElement => {
  const { statistiques } = useStatistiquesCartographieContext();
  const searchParams = useSearchParams();

  const decoupage =
    searchParams.get("granularite") === "departement" ? "dep" : "reg";

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [departementsData, setDepartementsData] = useState<
    Record<string, number>
  >({});

  const [departementsEvolutionData, setDepartementsEvolutionData] = useState<
    Record<string, { delta?: number; direction?: string | null }>
  >({});

  const [isLoadingRegion, setIsLoadingRegion] = useState(false);

  const zoneData = useMemo(() => {
    if (!statistiques?.zones) {
      return {};
    }

    return statistiques.zones.reduce(
      (accumulator, zone) => {
        const cleanCode = zone.code.replace(/^FR-/, "");
        accumulator[cleanCode] = zone.value ?? 0;
        return accumulator;
      },
      {} as Record<string, number>
    );
  }, [statistiques]);

  useEffect(() => {
    if (!selectedRegion) {
      setDepartementsData({});
      setDepartementsEvolutionData({});
      return;
    }

    const fetchAllDepartements = async () => {
      setIsLoadingRegion(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set("granularite", "departement");

        if (!params.has("annee") && statistiques?.annee) {
          params.set("annee", statistiques.annee.toString());
        }
        if (!params.has("indicateur") && statistiques?.indicateur) {
          params.set("indicateur", statistiques.indicateur);
        }

        const response = await fetch(
          `/api/statistiques/cartographie?${params.toString()}`
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des départements");
        }

        const data = await response.json();

        const valuesRecord: Record<string, number> = {};
        const evolutionsRecord: Record<
          string,
          { delta?: number; direction?: string | null }
        > = {};

        data.zones.forEach(
          (zone: {
            code: string;
            value: number;
            evolution: {
              delta: number;
              direction: string;
            };
          }) => {
            const cleanCode = zone.code.replace(/^FR-/, "");

            valuesRecord[cleanCode] = zone.value ?? 0;

            evolutionsRecord[cleanCode] = {
              delta: zone.evolution?.delta,
              direction: zone.evolution?.direction,
            };
          }
        );
        setDepartementsData(valuesRecord);
        setDepartementsEvolutionData(evolutionsRecord);
      } catch (error) {
        console.error("Erreur cartographie :", error);
      } finally {
        setIsLoadingRegion(false);
      }
    };

    fetchAllDepartements();
  }, [selectedRegion, searchParams, statistiques]);

  return (
    <MapLayout
      zoneData={zoneData}
      departementsData={decoupage === "dep" ? zoneData : departementsData}
      departementsEvolutionData={departementsEvolutionData}
      decoupage={decoupage}
      selectedRegion={selectedRegion}
      setSelectedRegion={setSelectedRegion}
      isLoadingRegion={isLoadingRegion}
    />
  );
};
