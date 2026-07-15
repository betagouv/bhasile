import { ReactElement } from "react";

import { getInitialisationsActualisations } from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.service";
import { formatDate } from "@/app/utils/date.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { DashboardPagination } from "./DashboardPagination";
import { InitialisationActualisationRow } from "./InitialisationActualisationRow";
type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  page: number;
};

export const InitialisationsActualisationsBlock = async ({
  filters,
  user,
  page,
}: Props): Promise<ReactElement> => {
  const data = await getInitialisationsActualisations(filters, user, page);

  const rows = data.rows;

  return (
    <Block>
      <BlockTitle
        title="Initialisation et actualisations de structures"
        total={data.total}
        iconClassName="fr-icon-refresh-line"
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

      {data.total > MIDDLE_PAGE_SIZE && (
        <div className="flex justify-center border-t border-default-grey p-4">
          <DashboardPagination
            total={data.total}
            pageParam="actualisationsPage"
          />
        </div>
      )}
    </Block>
  );
};
