import Link from "next/link";
import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import { QueryPersister } from "@/app/components/QueryPersister";
import Loader from "@/app/components/ui/Loader";
import {
  getFirstParam,
  getPageParam,
  parseSortDirection,
  parseStructureColumn,
  SearchParams,
} from "@/app/utils/searchParams.util";
import { STRUCTURES_STORAGE_KEY } from "@/constants";
import { StructuresQuery } from "@/types/structure-list.type";

import { Toolbar } from "./_components/Toolbar";
import { VisualizationTabs } from "./_components/VisualizationTabs";
import { StructuresContent } from "./StructuresContent";
import { StructuresCount } from "./StructuresCount";
import { StructuresMapContent } from "./StructuresMapContent";
import { StructuresSkeleton } from "./StructuresSkeleton";

export default async function Structures({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const query = buildStructuresQuery(params);

  const count = (
    <ContentErrorBoundary fallback={<div className="pl-3 min-w-24" />}>
      <Suspense fallback={<div className="pl-3 min-w-24" />}>
        <StructuresCount query={query} />
      </Suspense>
    </ContentErrorBoundary>
  );

  return (
    <div className="h-full w-full flex flex-col">
      <QueryPersister
        targetPath="/structures"
        storageKey={STRUCTURES_STORAGE_KEY}
      />
      <div className="flex justify-between items-center px-6 border-b border-b-border-default-grey min-h-[4.35rem] sticky top-0 bg-lifted-grey z-10">
        <div className="flex items-center">
          <h2
            className="text-title-blue-france fr-h5 mb-0 pr-4"
            id="structures-titre"
          >
            Structures d’hébergement
          </h2>
          <VisualizationTabs vue={query.vue} />
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="fr-btn fr-btn--secondary flex gap-2"
            href="/structures/transformation/type?type=huda"
          >
            <span className="fr-icon-arrow-left-right-line fr-icon--sm" />
            Transformer HUDA en CADA
          </Link>
          <Link
            className="fr-btn fr-btn--secondary flex gap-2"
            href="/structures/transformation/type?type=creation"
          >
            <span className="fr-icon-add-line fr-icon--sm" />
            Créer une structure
          </Link>
        </div>
      </div>

      {query.vue === "tableau" ? (
        <>
          <Toolbar variant="tableau" count={count} />
          <div id="tableau">
            <ContentErrorBoundary
              fallback={
                <p className="p-16">
                  Erreur lors de la récupération des structures. Modifiez vos
                  filtres ou réessayez plus tard.
                </p>
              }
            >
              <Suspense fallback={<StructuresSkeleton />}>
                <StructuresContent query={query} />
              </Suspense>
            </ContentErrorBoundary>
          </div>
        </>
      ) : (
        <div id="carte" className="relative flex-1 min-h-0">
          <div className="absolute inset-0">
            <ContentErrorBoundary
              fallback={
                <p className="p-16">
                  Erreur lors de la récupération des structures.
                </p>
              }
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full w-full">
                    <Loader />
                  </div>
                }
              >
                <StructuresMapContent query={query} />
              </Suspense>
            </ContentErrorBoundary>
          </div>
          <div className="relative z-10">
            <Toolbar variant="carte" count={count} />
          </div>
        </div>
      )}
    </div>
  );
}

const buildStructuresQuery = (params: SearchParams): StructuresQuery => ({
  vue: getFirstParam(params.vue) === "carte" ? "carte" : "tableau",
  search: getFirstParam(params.search),
  page: getPageParam(params, "page"),
  type: getFirstParam(params.type),
  bati: getFirstParam(params.bati),
  placesAutorisees: getFirstParam(params.places),
  departements: getFirstParam(params.departements),
  operateurs: getFirstParam(params.operateurs),
  column: parseStructureColumn(getFirstParam(params.column)),
  direction: parseSortDirection(getFirstParam(params.direction)),
  isClosed: getFirstParam(params.statut) === "fermees",
});
