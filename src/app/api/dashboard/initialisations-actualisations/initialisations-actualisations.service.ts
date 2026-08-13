import {
  FINALISATION_FORM_SLUG,
  getActualisationFormSlug,
} from "@/app/api/forms/form.constants";
import { getActualisationYear } from "@/app/api/structures/actualisation.util";
import { paginateWithTotal } from "@/app/utils/list.util";
import { getNow } from "@/app/utils/now.util";
import { parseCommaList } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { InitialisationsActualisationsApiRead } from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import {
  findDashboardStructures,
  findFormDefinitionDeadline,
} from "./initialisations-actualisations.repository";
import { buildDashboardRows } from "./initialisations-actualisations.util";

export const getInitialisationsActualisations = async (
  filters: Filters,
  user: SessionUser | undefined,
  page: number
): Promise<InitialisationsActualisationsApiRead> => {
  const now = getNow();
  const year = getActualisationYear();

  const structures = await findDashboardStructures();

  const rows = buildDashboardRows(structures, {
    user,
    typeList: parseCommaList(filters.type),
    departementList: parseCommaList(filters.departements),
    operateurList: parseCommaList(filters.operateurs),
    year,
    now,
  });

  const [initialisationDefinition, actualisationDefinition] = await Promise.all(
    [
      findFormDefinitionDeadline(FINALISATION_FORM_SLUG),
      year === null
        ? Promise.resolve(null)
        : findFormDefinitionDeadline(getActualisationFormSlug(year)),
    ]
  );

  const { total, rows: pageRows } = paginateWithTotal(
    rows,
    page,
    MIDDLE_PAGE_SIZE
  );

  return {
    initialisationDeadline:
      initialisationDefinition?.deadline?.toISOString() ?? null,
    actualisationDeadline:
      actualisationDefinition?.deadline?.toISOString() ?? null,
    total,
    rows: pageRows,
  };
};
