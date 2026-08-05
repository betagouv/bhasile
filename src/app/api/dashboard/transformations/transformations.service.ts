import { getOngoingTransformationsForUser } from "@/app/api/transformations/transformation.service";
import { paginateWithTotal } from "@/app/utils/list.util";
import { parseCommaList } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { DashboardTransformationRow } from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { buildDashboardTransformationRows } from "./transformations.util";

export const getDashboardTransformations = async (
  filters: Filters,
  user: SessionUser | undefined,
  page: number
): Promise<{ total: number; rows: DashboardTransformationRow[] }> => {
  if (!user) {
    return { total: 0, rows: [] };
  }

  const transformations = await getOngoingTransformationsForUser(user);

  const rows = buildDashboardTransformationRows(transformations, {
    departementList: parseCommaList(filters.departements),
    operateurList: parseCommaList(filters.operateurs),
    typeList: parseCommaList(filters.type),
  });

  return paginateWithTotal(rows, page, MIDDLE_PAGE_SIZE);
};
