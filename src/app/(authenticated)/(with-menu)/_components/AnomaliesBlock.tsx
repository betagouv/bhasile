import { ReactElement } from "react";

import { getDashboardAnomalies } from "@/app/api/dashboard/anomalies/anomalies.service";
import {
  getFirstParam,
  getPageParam,
  SearchParams,
} from "@/app/utils/searchParams.util";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { AnomaliesControls } from "./AnomaliesControls";
import { AnomaliesGroups } from "./AnomaliesGroups";
import { Block } from "./Block";
import { BlockTitle } from "./BlockTitle";
import { ANOMALIES_BLOCK_HEADER } from "./dashboardBlocks";
import { DashboardPagination } from "./DashboardPagination";

export const AnomaliesBlock = async ({
  filters,
  user,
  searchParams,
}: Props): Promise<ReactElement> => {
  const groupBy =
    getFirstParam(searchParams.anomaliesGroupe) === "CODE"
      ? "CODE"
      : "STRUCTURE";
  const shouldShowIgnored =
    getFirstParam(searchParams.anomaliesIgnorees) === "1";
  const page = getPageParam(searchParams, "anomaliesPage");

  const { activeCount, totalNodes, nodes } = await getDashboardAnomalies(
    filters,
    user,
    { groupBy, shouldShowIgnored, page }
  );

  return (
    <Block>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <BlockTitle
          title={ANOMALIES_BLOCK_HEADER.title}
          total={activeCount}
          iconClassName={ANOMALIES_BLOCK_HEADER.icon}
        />
        <AnomaliesControls
          groupBy={groupBy}
          shouldShowIgnored={shouldShowIgnored}
        />
      </div>

      <AnomaliesGroups nodes={nodes} groupBy={groupBy} />

      {nodes.length === 0 && (
        <p className="border-t border-default-grey py-6 text-sm text-mention-grey">
          Aucune anomalie à examiner.
        </p>
      )}

      <DashboardPagination total={totalNodes} pageParam="anomaliesPage" />
    </Block>
  );
};

type Props = {
  filters: Filters;
  user: SessionUser | undefined;
  searchParams: SearchParams;
};
