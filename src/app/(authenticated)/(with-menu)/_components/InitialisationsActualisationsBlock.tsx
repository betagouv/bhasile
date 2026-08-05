import { ReactElement } from "react";

import { getInitialisationsActualisations } from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.service";
import { formatDate } from "@/app/utils/date.util";
import { getPageParam, SearchParams } from "@/app/utils/searchParams.util";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { INITIALISATIONS_ACTUALISATIONS_BLOCK_HEADER } from "./dashboardBlocks";
import { DashboardPagination } from "./DashboardPagination";
import { InitialisationActualisationRow } from "./InitialisationActualisationRow";

export const InitialisationsActualisationsBlock = async ({
  filters,
  user,
  searchParams,
}: Props): Promise<ReactElement> => {
  const page = getPageParam(searchParams, "actualisationsPage");
  const data = await getInitialisationsActualisations(filters, user, page);

  const rows = data.rows;

  return (
    <Block>
      <BlockTitle
        title={INITIALISATIONS_ACTUALISATIONS_BLOCK_HEADER.title}
        total={data.total}
        iconClassName={INITIALISATIONS_ACTUALISATIONS_BLOCK_HEADER.icon}
      />

      <div className="grid grid-cols-[repeat(4,max-content)_minmax(0,1fr)_max-content_max-content_auto] gap-x-4">
        <div className="col-span-full grid grid-cols-subgrid pb-2 text-xs font-bold text-mention-grey">
          <div className="col-start-6 text-center">
            <span className="uppercase">Initialisation</span>
            <span className="block italic">
              avant le {formatDate(data.initialisationDeadline ?? undefined)}
            </span>
          </div>
          <div className="text-center">
            <span className="uppercase">Actualisation</span>
            <span className="block italic">
              avant le {formatDate(data.actualisationDeadline ?? undefined)}
            </span>
          </div>
        </div>

        {rows.map((row) => (
          <InitialisationActualisationRow key={row.id} row={row} />
        ))}
      </div>

      {rows.length === 0 && (
        <p className="border-t border-default-grey px-4 py-6 text-sm text-mention-grey">
          Aucune structure à actualiser.
        </p>
      )}

      <DashboardPagination total={data.total} pageParam="actualisationsPage" />
    </Block>
  );
};

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  searchParams: SearchParams;
};
