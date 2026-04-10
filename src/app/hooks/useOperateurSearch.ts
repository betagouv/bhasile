import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FetchState } from "@/types/fetch-state.type";
import { StructureType } from "@/types/structure.type";

import { useFetchState } from "../context/FetchStateContext";

export const useOperateurSearch = () => {
  const [operateurs, setOperateurs] = useState<
    OperateurStatsApiType[] | undefined
  >(undefined);
  const [totalOperateurs, setTotalOperateurs] = useState<number>(0);

  const { setFetchState } = useFetchState();

  const searchParams = useSearchParams();
  const page: string | null = searchParams.get("page");

  const getOperateurs = useCallback(
    async (
      page: string | null
    ): Promise<{
      operateurs: OperateurStatsApiType[];
      totalOperateurs: number;
    }> => {
      setFetchState(`operateurs-search`, FetchState.LOADING);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "";

        const params = new URLSearchParams();
        if (page) {
          params.append("page", String(page));
        }

        const result = await fetch(
          `${baseUrl}/api/operateurs?${params.toString()}`
        );

        if (!result.ok) {
          setFetchState(`operateurs-search`, FetchState.ERROR);
          throw new Error(
            `Erreur de récupération des opérateurs : ${result.status}`
          );
        }
        setFetchState(`operateurs-search`, FetchState.IDLE);
        return await result.json();
      } catch (error) {
        console.error("Erreur de récupération des opérateurs :", error);
        setFetchState(`operateurs-search`, FetchState.ERROR);
        return { operateurs: [], totalOperateurs: 0 };
      }
    },
    [setFetchState]
  );

  useEffect(() => {
    const fetchStructures = async () => {
      const { operateurs, totalOperateurs } = await getOperateurs(page);
      setOperateurs(operateurs);
      setTotalOperateurs(totalOperateurs);
    };

    fetchStructures();
  }, [getOperateurs, page]);

  return {
    operateurs,
    totalOperateurs,
  };
};

type OperateurStatsApiType = {
  id: number;
  name: string;
  nbStructures: number;
  totalPlaces: number;
  pourcentageParc: number;
  structureTypes: StructureType[];
};
