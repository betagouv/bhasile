import { useCallback, useEffect, useState } from "react";

import { CpomApiType } from "@/schemas/api/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useFetchState } from "../context/FetchStateContext";

export const useCpomsSearch = () => {
  const [cpoms, setCpoms] = useState<CpomApiType[] | undefined>(undefined);
  const [totalCpoms, setTotalCpoms] = useState<number>(0);

  const { setFetchState } = useFetchState();

  const getCpoms = useCallback(async (): Promise<{
    cpoms: CpomApiType[];
    totalCpoms: number;
  }> => {
    setFetchState(`cpom-search`, FetchState.LOADING);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "";

      const result = await fetch(`${baseUrl}/api/cpoms`);

      if (!result.ok) {
        setFetchState(`cpom-search`, FetchState.ERROR);
        throw new Error(`Failed to fetch structures: ${result.status}`);
      }
      setFetchState(`cpom-search`, FetchState.IDLE);
      return await result.json();
    } catch (error) {
      console.error("Error fetching structures:", error);
      setFetchState(`cpom-search`, FetchState.ERROR);
      return { cpoms: [], totalCpoms: 0 };
    }
  }, [setFetchState]);

  useEffect(() => {
    const fetchStructures = async () => {
      const { cpoms, totalCpoms } = await getCpoms();
      setCpoms(cpoms);
      setTotalCpoms(totalCpoms);
    };

    fetchStructures();
  }, [getCpoms]);

  return {
    cpoms,
    totalCpoms,
  };
};
