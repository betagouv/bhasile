import { SearchParams } from "@/app/utils/search-params.util";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import {
  getFiltersFromSearchParams,
  toFiltersSearchParams,
} from "@/utils/filters.util";

import { StatistiquesContent } from "./_components/StatistiquesContent";
import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { getStatistiques } from "./getStatistiques";

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = getFiltersFromSearchParams(await searchParams);
  const statistiques = await getStatistiques(filters);
  const hasFilters = toFiltersSearchParams(filters).size > 0;

  return (
    <StatistiquesProvider entity={statistiques}>
      <div className="flex flex-col h-full">
        <StatistiquesHeader />
        {statistiques ? (
          <StatistiquesContent />
        ) : (
          <p className="p-16">
            {hasFilters
              ? "Aucune structure ne correspond à vos filtres."
              : "Aucune structure dans votre périmètre."}
          </p>
        )}
      </div>
    </StatistiquesProvider>
  );
}
