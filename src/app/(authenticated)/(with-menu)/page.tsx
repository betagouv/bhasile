import { getServerSession } from "next-auth";
import { ReactElement, Suspense } from "react";

import { getFirstParam } from "@/app/utils/searchParams.util";
import { authOptions } from "@/lib/next-auth/auth";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { BlockSkeleton } from "./_components/BlockSkeleton";
import { DashboardHeader } from "./_components/DashboardHeader";
import { InitialisationsActualisationsBlock } from "./_components/InitialisationsActualisationsBlock";
import { NotificationsBlock } from "./_components/NotificationsBlock";
import { RappelsBlock } from "./_components/RappelsBlock";
import { TransformationsBlock } from "./_components/TransformationsBlock";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  const params = await searchParams;

  const filters: Filters = {
    departements: getFirstParam(params.departements),
    operateurs: getFirstParam(params.operateurs),
    type: getFirstParam(params.type),
  };
  const page = Number(getFirstParam(params.actualisationsPage)) || 0;

  return (
    <>
      <DashboardHeader prenom={user?.prenom} />
      <div className="flex flex-col gap-3 max-w-7xl mx-auto p-3">
        <Suspense fallback={null}>
          <NotificationsBlock />
        </Suspense>
        <Suspense
          fallback={
            <BlockSkeleton
              title="Rappels contractualisation et évaluations"
              icon="ri-list-check-3"
            />
          }
        >
          <RappelsBlock filters={filters} user={user} searchParams={params} />
        </Suspense>
        <Suspense
          fallback={
            <BlockSkeleton
              title="Créations, transformations et fermetures de structures"
              icon="fr-icon-community-line"
            />
          }
        >
          <TransformationsBlock filters={filters} user={user} />
        </Suspense>
        <Suspense
          fallback={
            <BlockSkeleton
              title="Initialisation et actualisations de structures"
              icon="fr-icon-refresh-line"
            />
          }
        >
          <InitialisationsActualisationsBlock
            filters={filters}
            user={user}
            page={page}
          />
        </Suspense>
      </div>
    </>
  );
}
