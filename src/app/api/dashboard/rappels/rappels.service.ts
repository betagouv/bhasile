import { findAllCpoms } from "@/app/api/cpoms/cpom.repository";
import { paginateRows } from "@/app/utils/list.util";
import { groupRappels } from "@/app/utils/rappel.util";
import { parseCommaList } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
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

  const now = new Date();
  const [structures, cpoms] = await Promise.all([
    findRappelStructures(),
    findAllCpoms(),
  ]);

  const rappels = buildRappels(structures, cpoms, {
    user,
    departementList: parseCommaList(filters.departements),
    operateurList: parseCommaList(filters.operateurs),
    typeList: parseCommaList(filters.type),
    now,
  });

  const nodes = groupRappels(rappels, options.echelle, options.groupBy);
  const totalNodes = nodes.length;
  const rappelCount = nodes.reduce(
    (total, node) => total + node.importantCount + node.urgentCount,
    0
  );

  const lastPage = Math.max(0, Math.ceil(totalNodes / MIDDLE_PAGE_SIZE) - 1);
  const currentPage = Math.min(Math.max(0, options.page), lastPage);

  return {
    rappelCount,
    totalNodes,
    nodes: paginateRows(nodes, currentPage, MIDDLE_PAGE_SIZE),
  };
};
