import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CpomApiType } from "@/schemas/api/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";
import { CpomColumn } from "@/types/ListColumn";

import { useFetchState } from "../context/FetchStateContext";

export const useCpomsSearch = () => {
  const [cpoms, setCpoms] = useState<CpomApiType[] | undefined>(undefined);
  const [totalCpoms, setTotalCpoms] = useState<number>(0);

  const { setFetchState } = useFetchState();

  const searchParams = useSearchParams();
  const page: string | null = searchParams.get("page");
  const departements: string | null = searchParams.get("departements");
  const column: CpomColumn | null = searchParams.get(
    "column"
  ) as CpomColumn | null;
  const direction: "asc" | "desc" | null = searchParams.get("direction") as
    | "asc"
    | "desc"
    | null;

  const getCpoms = useCallback(
    async (
      page: string | null,
      departements: string | null,
      column: CpomColumn | null,
      direction: "asc" | "desc" | null
    ): Promise<{
      cpoms: CpomApiType[];
      totalCpoms: number;
    }> => {
      setFetchState(`cpoms-search`, FetchState.LOADING);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "";

        const params = new URLSearchParams();
        if (page) {
          params.append("page", String(page));
        }
        if (departements) {
          params.append("departements", departements);
        }
        if (column) {
          params.append("column", column);
        }
        if (direction) {
          params.append("direction", direction);
        }

        const result = await fetch(`${baseUrl}/api/cpoms?${params.toString()}`);

        if (!result.ok) {
          setFetchState(`cpoms-search`, FetchState.ERROR);
          throw new Error(`Failed to fetch structures: ${result.status}`);
        }
        setFetchState(`cpoms-search`, FetchState.IDLE);
        return await result.json();
      } catch (error) {
        console.error("Error fetching structures:", error);
        setFetchState(`cpoms-search`, FetchState.ERROR);
        return { cpoms: [], totalCpoms: 0 };
      }
    },
    [setFetchState]
  );

  useEffect(() => {
    const fetchStructures = async () => {
      const { cpoms, totalCpoms } = await getCpoms(
        page,
        departements,
        column,
        direction
      );
      setCpoms(cpoms);
      setTotalCpoms(totalCpoms);
    };

    fetchStructures();
  }, [getCpoms, page, departements, column, direction]);

  return {
    cpoms,
    totalCpoms,
  };
};
