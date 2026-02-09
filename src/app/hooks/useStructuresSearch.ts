import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { StructureApiType } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";
import { FetchState } from "@/types/fetch-state.type";
import { StructureColumn } from "@/types/ListColumn";
import { StructureType } from "@/types/structure.type";

import { useFetchState } from "../context/FetchStateContext";

export const useStructuresSearch = ({ map }: { map?: boolean }) => {
  const [structures, setStructures] = useState<StructureApiType[] | undefined>(
    undefined
  );
  const [totalStructures, setTotalStructures] = useState<number>(0);

  const { setFetchState } = useFetchState();

  const searchParams = useSearchParams();
  const page: string | null = searchParams.get("page");
  const search: string | null = searchParams.get("search");
  const type: StructureType | null = searchParams.get(
    "type"
  ) as StructureType | null;
  const bati: Repartition | null = searchParams.get(
    "bati"
  ) as Repartition | null;
  const places: string | null = searchParams.get("places");
  const departements: string | null = searchParams.get("departements");
  const column: StructureColumn | null = searchParams.get(
    "column"
  ) as StructureColumn | null;
  const direction: "asc" | "desc" | null = searchParams.get("direction") as
    | "asc"
    | "desc"
    | null;

  const getStructures = useCallback(
    async (
      page: string | null,
      search: string | null,
      type: StructureType | null,
      bati: Repartition | null,
      places: string | null,
      departements: string | null,
      column: StructureColumn | null,
      direction: "asc" | "desc" | null
    ): Promise<{ structures: StructureApiType[]; totalStructures: number }> => {
      setFetchState(`structure-${map ? "map" : "search"}`, FetchState.LOADING);
      try {
        const baseUrl = process.env.NEXT_URL || "";
        const params = new URLSearchParams();
        if (page) {
          params.append("page", String(page));
        }
        if (search) {
          params.append("search", search);
        }
        if (type) {
          params.append("type", type);
        }
        if (bati) {
          params.append("bati", bati);
        }
        if (places != null) {
          params.append("places", String(places));
        }
        if (departements && !map) {
          params.append("departements", departements);
        }
        if (map) {
          params.append("map", "true");
        }
        if (column) {
          params.append("column", column);
        }
        if (direction) {
          params.append("direction", direction);
        }
        const result = await fetch(
          `${baseUrl}/api/structures?${params.toString()}`
        );

        if (!result.ok) {
          setFetchState(
            `structure-${map ? "map" : "search"}`,
            FetchState.ERROR
          );
          throw new Error(`Failed to fetch structures: ${result.status}`);
        }
        setFetchState(`structure-${map ? "map" : "search"}`, FetchState.IDLE);
        return await result.json();
      } catch (error) {
        console.error("Error fetching structures:", error);
        setFetchState(`structure-${map ? "map" : "search"}`, FetchState.ERROR);
        return { structures: [], totalStructures: 0 };
      }
    },
    [setFetchState, map]
  );

  useEffect(() => {
    const fetchStructures = async () => {
      const { structures, totalStructures } = await getStructures(
        page,
        search,
        type,
        bati,
        places,
        departements,
        column,
        direction
      );
      setStructures(structures);
      setTotalStructures(totalStructures);
    };

    fetchStructures();
  }, [
    page,
    search,
    type,
    bati,
    places,
    departements,
    column,
    direction,
    getStructures,
  ]);

  return {
    structures,
    totalStructures,
  };
};
