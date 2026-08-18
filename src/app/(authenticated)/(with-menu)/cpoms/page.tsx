import Link from "next/link";
import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import { Filters } from "@/app/components/filters/Filters";
import {
  getFirstParam,
  getPageParam,
  SearchParams,
} from "@/app/utils/searchParams.util";
import { CpomsQuery } from "@/types/cpom.type";
import { parseCpomColumn, parseSortDirection } from "@/types/ListColumn";

import { CpomsContent } from "./CpomsContent";
import { CpomsCount } from "./CpomsCount";
import { CpomsSkeleton } from "./CpomsSkeleton";

export default async function Cpoms({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const query: CpomsQuery = {
    page: getPageParam(params, "page"),
    departements: getFirstParam(params.departements),
    column: parseCpomColumn(getFirstParam(params.column)),
    direction: parseSortDirection(getFirstParam(params.direction)),
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <h2 className="text-title-blue-france fr-h5 mr-4 mb-0" id="cpoms-titre">
          CPOM
        </h2>
        <Link
          href="/cpoms/ajout/01-identification"
          className="fr-btn fr-btn--secondary"
        >
          <span className="fr-icon-add-line fr-icon--sm" /> Créer un CPOM
        </Link>
      </div>
      <div className="flex gap-2 justify-end items-center py-3.5 px-6 z-2">
        <Filters showFilters={false} showLocation={true} />
        <ContentErrorBoundary fallback={<div className="pl-3 min-w-24" />}>
          <Suspense fallback={<div className="pl-3 min-w-24" />}>
            <CpomsCount query={query} />
          </Suspense>
        </ContentErrorBoundary>
      </div>
      <ContentErrorBoundary
        fallback={
          <p className="p-16">
            Erreur lors de la récupération des CPOM. Modifiez vos filtres ou
            réessayez plus tard.
          </p>
        }
      >
        <Suspense fallback={<CpomsSkeleton />}>
          <CpomsContent query={query} />
        </Suspense>
      </ContentErrorBoundary>
    </div>
  );
}
