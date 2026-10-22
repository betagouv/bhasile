import { getServerSession } from "next-auth";
import { ReactElement, Suspense } from "react";

import { ContentErrorBoundary } from "@/app/components/ContentErrorBoundary";
import {
  getFirstParam,
  getPageParam,
  parseCpomColumn,
  parseSortDirection,
  SearchParams,
} from "@/app/utils/search-params.util";
import { PageHeader } from "@/components/PageHeader";
import { authOptions } from "@/lib/next-auth/auth";
import { CpomsQuery } from "@/types/cpom.type";
import { SessionUser } from "@/types/global";

import { CpomsContent } from "./CpomsContent";
import { CpomsCount } from "./CpomsCount";
import { CpomsSkeleton } from "./CpomsSkeleton";

export default async function Cpoms({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const query: CpomsQuery = {
    page: getPageParam(params, "page"),
    departements: getFirstParam(params.departements),
    operateurs: getFirstParam(params.operateurs),
    types: getFirstParam(params.types),
    column: parseCpomColumn(getFirstParam(params.column)),
    direction: parseSortDirection(getFirstParam(params.direction)),
    user: session?.user as SessionUser | undefined,
  };

  return (
    <div className="h-full w-full flex flex-col">
      <PageHeader
        title="CPOM"
        titleId="cpoms-titre"
        menuActions={[
          { label: "Créer un CPOM", href: "/cpoms/ajout/01-identification" },
        ]}
      />
      <div className="flex gap-2 justify-end items-center py-3.5 px-6 z-2">
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
