import { headers } from "next/headers";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContent } from "./_components/StatistiquesContent";
import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { StatistiquesProvider } from "./_context/StatistiquesContext";

type GetStatistiquesArgs = {
  departements?: string;
  operateurs?: string;
  types?: string;
};

async function getStatistiques({
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

  const result = await fetch(`${baseUrl}/api/statistiques?${params.toString()}`, {
    cache: "no-store",
    // Requête côté serveur donc il faut appeler les headers manuellement
    headers: await headers(),
  });
  if (!result.ok) {
    throw new Error(
      `Impossible de récupérer les statistiques : ${result.status}`
    );
  }
  return await result.json();
}

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const awaitedSearchParams = await searchParams;

  const departements =
    typeof awaitedSearchParams.departements === "string"
      ? awaitedSearchParams.departements
      : undefined;
  const operateurs =
    typeof awaitedSearchParams.operateurs === "string"
      ? awaitedSearchParams.operateurs
      : undefined;
  const types =
    typeof awaitedSearchParams.types === "string"
      ? awaitedSearchParams.types
      : undefined;

  const statistiques = await getStatistiques({
    departements,
    operateurs,
    types,
  });

  return (
    <StatistiquesProvider statistiques={statistiques}>
      <div className="flex flex-col h-full">
        <StatistiquesHeader />
        <StatistiquesContent />
      </div>
    </StatistiquesProvider>
  );
}
