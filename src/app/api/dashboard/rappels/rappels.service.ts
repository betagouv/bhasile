import { findAllCpoms } from "@/app/api/cpoms/cpom.repository";
import { resolveGlobalFilters } from "@/app/api/global-filters/global-filters.service";
import { paginateWithTotal } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { groupRappels } from "@/app/utils/rappel.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { getUpdatableCpomWhere } from "@/lib/casl";
import {
  RappelEchelle,
  RappelGroupBy,
  RappelGroupNode,
} from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { findRappelStructures } from "./rappels.repository";
import { buildRappels } from "./rappels.util";

export type DashboardRappelsResult = {
  rappelCount: number;
  totalNodes: number;
  nodes: RappelGroupNode[];
};

export const getDashboardRappels = async (
  filters: Filters,
  user: SessionUser | undefined,
  options: { echelle: RappelEchelle; groupBy: RappelGroupBy; page: number }
): Promise<DashboardRappelsResult> => {
  if (!user) {
    return { rappelCount: 0, totalNodes: 0, nodes: [] };
  }

  const now = getNow();
  const [structures, cpoms] = await Promise.all([
    findRappelStructures(),
    findAllCpoms(getUpdatableCpomWhere(user)),
  ]);

  const rappels = buildRappels(structures, cpoms, {
    user,
    ...(await resolveGlobalFilters(filters)),
    now,
  });

  const nodes = groupRappels(rappels, options.echelle, options.groupBy);
  const rappelCount = nodes.reduce(
    (total, node) => total + node.importantCount + node.urgentCount,
    0
  );

  const { total: totalNodes, rows: pagedNodes } = paginateWithTotal(
    nodes,
    options.page,
    MIDDLE_PAGE_SIZE
  );

  return {
    rappelCount,
    totalNodes,
    nodes: pagedNodes,
  };
};
