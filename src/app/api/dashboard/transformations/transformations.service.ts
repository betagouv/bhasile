import { resolveGlobalFilters } from "@/app/api/global-filters/global-filters.service";
import { getOngoingTransformationsForUser } from "@/app/api/transformations/transformation.service";
import { paginateWithTotal } from "@/app/utils/list.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { defineAbilityFor } from "@/lib/casl";
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
    ability: defineAbilityFor(user),
    ...(await resolveGlobalFilters(filters)),
  });

  return paginateWithTotal(rows, page, MIDDLE_PAGE_SIZE);
};
