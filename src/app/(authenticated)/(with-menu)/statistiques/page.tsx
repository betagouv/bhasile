import { SearchParams } from "@/app/utils/search-params.util";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";
import { getGlobalFilters } from "@/utils/global-filters.util";

import { StatistiquesContent } from "./_components/StatistiquesContent";
import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { getStatistiques } from "./getStatistiques";

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const statistiques = await getStatistiques(
    getGlobalFilters(await searchParams)
  );

  return (
    <StatistiquesProvider entity={statistiques}>
      <div className="flex flex-col h-full">
        <StatistiquesHeader />
        {statistiques ? (
          <StatistiquesContent />
        ) : (
          <p className="p-16">Aucune structure ne correspond à vos filtres.</p>
        )}
      </div>
    </StatistiquesProvider>
  );
}
