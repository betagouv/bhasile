import { headers } from "next/headers";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";
import { Filters } from "@/types/filters.type";
import { toGlobalFiltersSearchParams } from "@/utils/global-filters.util";

export async function getStatistiques(
  filters: Filters
): Promise<StatistiqueApiRead | null> {
  const baseUrl = process.env.NEXT_URL || "";
  const params = toGlobalFiltersSearchParams(filters);

  const result = await fetch(
    `${baseUrl}/api/statistiques?${params.toString()}`,
    {
      cache: "no-store",
      // Requête côté serveur donc il faut appeler les headers manuellement
      headers: await headers(),
    }
  );
  if (!result.ok) {
    throw new Error(
      `Impossible de récupérer les statistiques : ${result.status}`
    );
  }
  return await result.json();
}
