import { getServerSession } from "next-auth";
import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import { QueryPersister } from "@/app/components/QueryPersister";
import Loader from "@/app/components/ui/Loader";
import {
  getFirstParam,
  getPageParam,
  parseMapMode,
  parseSortDirection,
  parseStructureColumn,
  SearchParams,
} from "@/app/utils/search-params.util";
import { CallToActionBanner } from "@/components/CallToActionBanner";
import { PageHeader } from "@/components/PageHeader";
import { STRUCTURES_STORAGE_KEY } from "@/constants";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";
import { StructuresQuery } from "@/types/structure-list.type";
import { getFiltersFromSearchParams } from "@/utils/filters.util";

import { Toolbar } from "./_components/Toolbar";
import { VisualizationTabs } from "./_components/VisualizationTabs";
import { PlacesMapNotice } from "./PlacesMapNotice";
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
  const session = await getServerSession(authOptions);
  const query = buildStructuresQuery(
    params,
    session?.user as SessionUser | undefined
  );

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
      <PageHeader
        title="Structures"
        titleId="structures-titre"
        tabs={<VisualizationTabs vue={query.vue} />}
        menuActions={[
          {
            label: "Créer une structure",
            href: "/structures/transformation/type?type=creation",
          },
        ]}
      >
        <CallToActionBanner
          message="Vous pouvez dès à présent renseigner les transformations actées des structures HUDA en CADA."
          label="Transformer HUDA en CADA"
          href="/structures/transformation/type?type=huda"
        />
      </PageHeader>

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
            {query.mode === "places" && (
              <ContentErrorBoundary fallback={null}>
                <Suspense fallback={null}>
                  <PlacesMapNotice query={query} />
                </Suspense>
              </ContentErrorBoundary>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const buildStructuresQuery = (
  params: SearchParams,
  user: SessionUser | undefined
): StructuresQuery => {
  const isClosed = getFirstParam(params.statut) === "fermees";
  return {
    vue: getFirstParam(params.vue) === "carte" ? "carte" : "tableau",
    mode: parseMapMode(getFirstParam(params.mode), isClosed),
    search: getFirstParam(params.search),
    page: getPageParam(params, "page"),
    ...getFiltersFromSearchParams(params),
    column: parseStructureColumn(getFirstParam(params.column)),
    direction: parseSortDirection(getFirstParam(params.direction)),
    isClosed,
    user,
  };
};
