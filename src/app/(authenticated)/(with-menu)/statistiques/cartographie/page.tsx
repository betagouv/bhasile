import { headers } from "next/headers";

import { getCurrentYear } from "@/app/utils/now.util";
import { SearchParams } from "@/app/utils/search-params.util";
import { StatistiquesCartographieProvider } from "@/contexts/StatistiquesCartographieContext";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import {
  CartographieApiRead,
  DEFAULT_CARTOGRAPHIE_GRANULARITE,
  DEFAULT_CARTOGRAPHIE_INDICATEUR,
} from "@/schemas/api/statistique-cartographie.schema";
import { Filters } from "@/types/filters.type";
import {
  getFiltersFromSearchParams,
  toFiltersSearchParams,
} from "@/utils/filters.util";

import { StatistiquesCartographie } from "../_components/StatistiquesCartographie";
import { StatistiquesHeader } from "../_components/StatistiquesHeader";
import { getStatistiques } from "../getStatistiques";

type GetStatistiquesCartographieArgs = {
  filters: Filters;
  granularite: string;
  indicateur: string;
  annee: string;
};

async function getStatistiquesCartographie({
  filters,
  granularite,
  indicateur,
  annee,
}: GetStatistiquesCartographieArgs): Promise<CartographieApiRead> {
  const baseUrl = process.env.NEXT_URL || "";
  const params = toFiltersSearchParams(filters);

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
  const filters = getFiltersFromSearchParams(awaitedSearchParams);

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
      : String(getCurrentYear() - 1);

  const [statistiquesCartographie, statistiques] = await Promise.all([
    getStatistiquesCartographie({
      filters,
      granularite,
      indicateur,
      annee,
    }),
    getStatistiques(filters),
  ]);

  return (
    <StatistiquesProvider entity={statistiques}>
      <StatistiquesCartographieProvider entity={statistiquesCartographie}>
        <div className="flex flex-col h-full">
          <StatistiquesHeader />
          <StatistiquesCartographie />
        </div>
      </StatistiquesCartographieProvider>
    </StatistiquesProvider>
  );
}
