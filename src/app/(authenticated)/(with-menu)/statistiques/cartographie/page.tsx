import { headers } from "next/headers";

import { SearchParams } from "@/app/utils/searchParams.util";
import { DEFAULT_CARTOGRAPHIE_ANNEE } from "@/constants";
import { StatistiquesCartographieProvider } from "@/contexts/StatistiquesCartographieContext";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import {
  CartographieApiRead,
  DEFAULT_CARTOGRAPHIE_GRANULARITE,
  DEFAULT_CARTOGRAPHIE_INDICATEUR,
} from "@/schemas/api/statistique-cartographie.schema";

import { StatistiquesCartographie } from "../_components/StatistiquesCartographie";
import { StatistiquesHeader } from "../_components/StatistiquesHeader";
import { StatistiquesPdfExportModal } from "../_components/StatistiquesPdfExportModal";
import { getStatistiques } from "../page";

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
  searchParams: Promise<SearchParams>;
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
      : DEFAULT_CARTOGRAPHIE_GRANULARITE;

  const indicateur =
    typeof awaitedSearchParams.indicateur === "string"
      ? awaitedSearchParams.indicateur
      : DEFAULT_CARTOGRAPHIE_INDICATEUR;

  const annee =
    typeof awaitedSearchParams.annee === "string"
      ? awaitedSearchParams.annee
      : String(DEFAULT_CARTOGRAPHIE_ANNEE);

  const [statistiquesCartographie, statistiques] = await Promise.all([
    getStatistiquesCartographie({
      departements,
      operateurs,
      types,
      granularite,
      indicateur,
      annee,
    }),
    getStatistiques({
      departements,
      operateurs,
      types,
    }),
  ]);

  return (
    <StatistiquesProvider entity={statistiques}>
      <StatistiquesCartographieProvider entity={statistiquesCartographie}>
        <div className="flex flex-col h-full">
          <StatistiquesHeader />
          <StatistiquesCartographie />
          <StatistiquesPdfExportModal />
        </div>
      </StatistiquesCartographieProvider>
    </StatistiquesProvider>
  );
}
