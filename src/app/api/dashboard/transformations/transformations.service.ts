import { getOngoingTransformationsForUser } from "@/app/api/transformations/transformation.service";
import { parseCommaList } from "@/app/utils/string.util";
import { DashboardTransformationRow } from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import { buildDashboardTransformationRows } from "./transformations.util";

export const getDashboardTransformations = async (
  filters: Filters,
  user: SessionUser | undefined
): Promise<DashboardTransformationRow[]> => {
  if (!user) {
    return [];
  }

  const transformations = await getOngoingTransformationsForUser(user);

  return buildDashboardTransformationRows(transformations, {
    departementList: parseCommaList(filters.departements),
    operateurList: parseCommaList(filters.operateurs),
    typeList: parseCommaList(filters.type),
  });
};
