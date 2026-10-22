import { paginateWithTotal } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { AnomalieGroupBy, AnomalieGroupNode } from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";
import { parseGlobalFilters } from "@/utils/global-filters.util";

import { findAnomalieStructures } from "./anomalies.repository";
import {
  buildDashboardAnomalies,
  groupDashboardAnomalies,
} from "./anomalies.util";

export type DashboardAnomaliesResult = {
  activeCount: number;
  totalNodes: number;
  nodes: AnomalieGroupNode[];
};

export const getDashboardAnomalies = async (
  filters: Filters,
  user: SessionUser | undefined,
  options: {
    groupBy: AnomalieGroupBy;
    shouldShowIgnored: boolean;
    page: number;
  }
): Promise<DashboardAnomaliesResult> => {
  if (!user) {
    return { activeCount: 0, totalNodes: 0, nodes: [] };
  }

  const structures = await findAnomalieStructures();

  const anomalies = buildDashboardAnomalies(structures, {
    user,
    ...parseGlobalFilters(filters),
    shouldShowIgnored: options.shouldShowIgnored,
    now: getNow(),
  });

  const nodes = groupDashboardAnomalies(anomalies, options.groupBy);
  const activeCount = nodes.reduce(
    (total, node) => total + node.activeCount,
    0
  );

  const { total: totalNodes, rows: pagedNodes } = paginateWithTotal(
    nodes,
    options.page,
    MIDDLE_PAGE_SIZE
  );

  return { activeCount, totalNodes, nodes: pagedNodes };
};
