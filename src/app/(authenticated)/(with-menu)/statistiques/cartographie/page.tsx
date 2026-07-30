import { headers } from "next/headers";

import { CURRENT_YEAR } from "@/constants";
import { CartographieApiRead } from "@/schemas/api/statistique-cartographie.schema";

import { StatistiquesCartographie } from "../_components/StatistiquesCartographie";
import { StatistiquesHeader } from "../_components/StatistiquesHeader";
import { StatistiquesCartographieProvider } from "../_context/StatistiquesCartographieContext";

type GetStatistiquesCartographieArgs = {
  departements?: string;
  operateurs?: string;
  types?: string;
  granularite: string;
  indicateur: string;
  annee: string;
};

async function getStatistiquesCartographie({
  departements,
  operateurs,
  types,
  granularite,
  indicateur,
  annee,
}: GetStatistiquesCartographieArgs): Promise<CartographieApiRead> {
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

  params.append("granularite", granularite);
  params.append("indicateur", indicateur);
  params.append("annee", annee);

  const result = await fetch(
    `${baseUrl}/api/statistiques/cartographie?${params.toString()}`,
    {
      cache: "no-store",
      headers: await headers(),
    }
  );

  if (!result.ok) {
    throw new Error(
      `Impossible de récupérer les statistiques de cartographie : ${result.status}`
    );
  }
  return await result.json();
}

export default async function CartographiePage({
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

  const granularite =
    typeof awaitedSearchParams.granularite === "string"
      ? awaitedSearchParams.granularite
      : "region";

  const indicateur =
    typeof awaitedSearchParams.indicateur === "string"
      ? awaitedSearchParams.indicateur
      : "structures.total";

  const annee =
    typeof awaitedSearchParams.annee === "string"
      ? awaitedSearchParams.annee
      : String(CURRENT_YEAR - 1);

  const statistiques = await getStatistiquesCartographie({
    departements,
    operateurs,
    types,
    granularite,
    indicateur,
    annee,
  });

  return (
    <StatistiquesCartographieProvider statistiques={statistiques}>
      <div className="flex flex-col h-full">
        <StatistiquesHeader />
        <StatistiquesCartographie />
      </div>
    </StatistiquesCartographieProvider>
  );
}
