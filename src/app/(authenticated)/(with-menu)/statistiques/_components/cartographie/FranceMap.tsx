"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useStatistiquesCartographieContext } from "@/contexts/StatistiquesCartographieContext";
import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";
import { ZoneDataInfo } from "@/types/map.type";

import {
  getDepartementNumerosForRegion,
  zonesToRichRecord,
  zonesToValueRecord,
} from "./cartographie.util";
import { MapLayout } from "./MapLayout";

export const FranceMap = (): ReactElement => {
  const { statistiques } = useStatistiquesCartographieContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const decoupage =
    searchParams.get("granularite") === "departement" ? "dep" : "reg";

  const selectedRegion =
    decoupage === "reg" ? searchParams.get("region") : null;

  const setSelectedRegion = useCallback(
    (region: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (region) {
        params.set("region", region);
      } else {
        params.delete("region");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

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

    const regionNumeros = getDepartementNumerosForRegion(selectedRegion);
    const activeDepartements = searchParams
      .get("departements")
      ?.split(",")
      .filter(Boolean);
    const scopedNumeros =
      activeDepartements && activeDepartements.length > 0
        ? regionNumeros.filter((numero) => activeDepartements.includes(numero))
        : regionNumeros;

    if (scopedNumeros.length === 0) {
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
