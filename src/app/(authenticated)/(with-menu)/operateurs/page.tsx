import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import { QueryPersister } from "@/app/components/QueryPersister";
import { SearchBar } from "@/app/components/SearchBar";
import {
  getFirstParam,
  getPageParam,
  SearchParams,
} from "@/app/utils/search-params.util";
import { PageHeader } from "@/components/PageHeader";
import { OPERATEURS_STORAGE_KEY } from "@/constants";
import { getGlobalFilters } from "@/utils/global-filters.util";

import { OperateursContent } from "./OperateursContent";
import { OperateursCount } from "./OperateursCount";
import { OperateursSkeleton } from "./OperateursSkeleton";

export default async function Operateurs({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const page = getPageParam(params, "page");
  const search = getFirstParam(params.search);
  const filters = getGlobalFilters(params);

  return (
    <div className="h-full w-full flex flex-col">
      <QueryPersister
        targetPath="/operateurs"
        storageKey={OPERATEURS_STORAGE_KEY}
      />
      <PageHeader title="Opérateurs" titleId="operateurs-titre" />
      <div className="flex gap-2 justify-end items-center py-3.5 px-6">
        <SearchBar placeholder="Nom d'opérateur" inputId="operateurs-search" />
        <ContentErrorBoundary fallback={<div className="pl-3 min-w-24" />}>
          <Suspense fallback={<div className="pl-3 min-w-24" />}>
            <OperateursCount page={page} search={search} filters={filters} />
          </Suspense>
        </ContentErrorBoundary>
      </div>
      <ContentErrorBoundary
        fallback={
          <p className="p-16">
            Erreur lors de la récupération des opérateurs. Modifiez votre
            recherche ou réessayez plus tard.
          </p>
        }
      >
        <Suspense fallback={<OperateursSkeleton />}>
          <OperateursContent page={page} search={search} filters={filters} />
        </Suspense>
      </ContentErrorBoundary>
    </div>
  );
}
