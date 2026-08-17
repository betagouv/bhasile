import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import { SearchBar } from "@/app/components/SearchBar";
import {
  getFirstParam,
  getPageParam,
  SearchParams,
} from "@/app/utils/searchParams.util";

import { OperateursQueryPersister } from "./OperateurQueryPersister";
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

  return (
    <div className="h-full w-full flex flex-col">
      <OperateursQueryPersister />
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <h2
          className="text-title-blue-france fr-h5 mr-4 mb-0"
          id="operateurs-titre"
        >
          Opérateurs
        </h2>
        <div className="flex items-center">
          <SearchBar
            placeholder="Nom d'opérateur"
            inputId="operateurs-search"
          />
          <ContentErrorBoundary fallback={<div className="pl-3 min-w-24" />}>
            <Suspense fallback={<div className="pl-3 min-w-24" />}>
              <OperateursCount page={page} search={search} />
            </Suspense>
          </ContentErrorBoundary>
        </div>
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
          <OperateursContent page={page} search={search} />
        </Suspense>
      </ContentErrorBoundary>
    </div>
  );
}
