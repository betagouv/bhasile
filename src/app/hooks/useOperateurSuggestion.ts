import { useCallback } from "react";

import { OperateurSuggestionApiRead } from "@/schemas/api/operateur.schema";

export const useOperateurSuggestion = () => {
  const fetchSuggestions = async (query: string) => {
    try {
      const params = new URLSearchParams();
      params.append("search", String(query));
      const response = await fetch(
        `/api/operateurs/suggestions?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();

      return data.map((operateur: OperateurSuggestionApiRead) => ({
        id: operateur.id,
        label: operateur.name,
        value: operateur.id,
      }));
    } catch (error) {
      console.error("Error fetching operateurs suggestions:", error);
      return [];
    }
  };

  const searchOperateurs = useCallback(
    async (query: string): Promise<OperateurSuggestion[]> => {
      if (!query || query.length < 3) {
        return [];
      }

      return fetchSuggestions(query);
    },
    []
  );

  const getAllOperateurs = useCallback(async (): Promise<
    OperateurSuggestion[]
  > => {
    return fetchSuggestions("");
  }, []);

  return { searchOperateurs, getAllOperateurs };
};

export type OperateurSuggestion = OperateurSuggestionApiRead & {
  id: string;
  label: string;
  key: string;
};
