import { SearchParams } from "@/app/utils/searchParams.util";
import { StatistiquesProvider } from "@/contexts/StatistiquesContext";

import { StatistiquesContent } from "./_components/StatistiquesContent";
import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { getStatistiques } from "./getStatistiques";

export default async function StatistiquesPage({
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

  const statistiques = await getStatistiques({
    departements,
    operateurs,
    types,
  });

  return (
    <StatistiquesProvider entity={statistiques}>
      <div className="flex flex-col h-full">
        <StatistiquesHeader />
        <StatistiquesContent />
      </div>
    </StatistiquesProvider>
  );
}
