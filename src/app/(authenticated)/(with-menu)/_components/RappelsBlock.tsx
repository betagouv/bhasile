import { ReactElement } from "react";

import { getDashboardRappels } from "@/app/api/dashboard/rappels/rappels.service";
import {
  parseRappelEchelle,
  resolveRappelGroupBy,
} from "@/app/utils/rappel.util";
import {
  getFirstParam,
  getPageParam,
  SearchParams,
} from "@/app/utils/searchParams.util";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { RAPPELS_BLOCK_HEADER } from "./dashboardBlocks";
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
  const page = getPageParam(searchParams, "rappelsPage");

  const { rappelCount, totalNodes, nodes } = await getDashboardRappels(
    filters,
    user,
    { echelle, groupBy, page }
  );

  return (
    <Block>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <BlockTitle
          title={RAPPELS_BLOCK_HEADER.title}
          total={rappelCount}
          iconClassName={RAPPELS_BLOCK_HEADER.icon}
        />
        <RappelsControls echelle={echelle} groupBy={groupBy} />
      </div>

      <div>
        {nodes.map((node) => (
          <RappelsGroupNode key={node.key} node={node} groupBy={groupBy} />
        ))}

        {nodes.length === 0 && (
          <p className="border-t border-default-grey py-6 text-sm text-mention-grey">
            Aucun rappel à cette échelle.
          </p>
        )}
      </div>

      <DashboardPagination total={totalNodes} pageParam="rappelsPage" />
    </Block>
  );
};

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  searchParams: SearchParams;
};
