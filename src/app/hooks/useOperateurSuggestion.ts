import { OperateurSuggestionApiRead } from "@/schemas/api/operateur.schema";

export function useOperateurSuggestion() {
  return async (query: string): Promise<OperateurSuggestion[]> => {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const response = await fetch(
        `/api/operateurs/suggestions?search=${query}`
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
}

type OperateurSuggestion = OperateurSuggestionApiRead & {
  id: string;
  label: string;
  key: string;
};
