import { headers } from "next/headers";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

export async function getStatistiques({
  departements,
  operateurs,
  types,
}: GetStatistiquesArgs): Promise<StatistiqueApiRead> {
  const baseUrl = process.env.NEXT_URL || "";
  const params = new URLSearchParams();
  if (departements) {
    params.append("departements", departements);
  }
  if (operateurs) {
    params.append("operateurs", operateurs);
  }
  if (types) {
    params.append("types", types);
  }

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

type GetStatistiquesArgs = {
  departements?: string;
  operateurs?: string;
  types?: string;
};
