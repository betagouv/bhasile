import { useCallback } from "react";

export type ActiviteStats = {
  averagePresencesInduesBPI: number | null;
  averagePresencesInduesDeboutees: number | null;
  averagePresencesIndues: number | null;
  averagePlacesVacantes: number | null;
  averagePlacesIndisponibles: number | null;
  averagePlacesAutorisees: number | null;
};

export const useActiviteStats = () => {
  const getStats = useCallback(
    async (
      departement: string,
      startDate: string,
      endDate: string
    ): Promise<ActiviteStats> => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "";
        const params = new URLSearchParams();
        params.append("departement", departement);
        params.append("startDate", startDate?.toString());
        params.append("endDate", endDate?.toString());
        const result = await fetch(
          `${baseUrl}/api/activites/stats?${params.toString()}`
        );

        if (!result.ok) {
          throw new Error(`Failed to fetch activite stats: ${result.status}`);
        }

        const data = await result.json();
        return data;
      } catch (error) {
        console.error("Error fetching activite stats:", error);
        return {
          averagePresencesInduesBPI: null,
          averagePresencesInduesDeboutees: null,
          averagePresencesIndues: null,
          averagePlacesVacantes: null,
          averagePlacesIndisponibles: null,
          averagePlacesAutorisees: null,
        };
      }
    },
    []
  );

  return { getStats };
};
