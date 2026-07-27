import { ReactElement } from "react";

import { getDashboardRappels } from "@/app/api/dashboard/rappels/rappels.service";
import {
  parseRappelEchelle,
  resolveRappelGroupBy,
} from "@/app/utils/rappel.util";
import { getFirstParam } from "@/app/utils/searchParams.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { DashboardPagination } from "./DashboardPagination";
import { RappelsControls } from "./RappelsControls";
import { RappelsGroupNode } from "./RappelsGroupNode";

export const RappelsBlock = async ({
  filters,
  user,
  searchParams,
}: Props): Promise<ReactElement> => {
  const echelle = parseRappelEchelle(
    getFirstParam(searchParams.rappelsEchelle)
  );
  const groupBy = resolveRappelGroupBy(
    echelle,
    getFirstParam(searchParams.rappelsGroupe)
  );
  const page = Number(getFirstParam(searchParams.rappelsPage)) || 0;

  const { rappelCount, totalNodes, nodes } = await getDashboardRappels(
    filters,
    user,
    { echelle, groupBy, page }
  );

  return (
    <Block>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <BlockTitle
          title="Rappels contractualisation et évaluations"
          total={rappelCount}
          iconClassName="ri-list-check-3"
        />
        <RappelsControls echelle={echelle} groupBy={groupBy} />
      </div>

      <div>
        {nodes.map((node) => (
          <RappelsGroupNode key={node.key} node={node} />
        ))}

        {nodes.length === 0 && (
          <p className="border-t border-default-grey py-6 text-sm text-mention-grey">
            Aucun rappel à cette échelle.
          </p>
        )}
      </div>

      {totalNodes > MIDDLE_PAGE_SIZE && (
        <div className="flex justify-center mt-4">
          <DashboardPagination total={totalNodes} pageParam="rappelsPage" />
        </div>
      )}
    </Block>
  );
};

type SearchParams = { [key: string]: string | string[] | undefined };

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  searchParams: SearchParams;
};
