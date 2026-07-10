import {
  actualisationCampaignDefinitionSlug,
  INITIALISATION_CAMPAIGN_DEFINITION_SLUG,
} from "@/app/api/campaigns/campaign.constants";
import { getActualisationYear } from "@/app/api/campaigns/campaign.util";
import { parseCommaList } from "@/app/utils/string.util";
import { DashboardStructureRow } from "@/types/dashboard.type";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import {
  findCampaignDeadline,
  findDashboardStructures,
} from "./initialisations-actualisations.repository";
import {
  buildDashboardRows,
  paginateDashboardRows,
} from "./initialisations-actualisations.util";

type InitialisationsActualisationsApiRead = {
  initialisationDeadline: string | null;
  actualisationDeadline: string | null;
  total: number;
  rows: DashboardStructureRow[];
};

export const getInitialisationsActualisations = async (
  filters: Filters,
  user: SessionUser | undefined,
  page: number
): Promise<InitialisationsActualisationsApiRead> => {
  const now = new Date();
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
      findCampaignDeadline(INITIALISATION_CAMPAIGN_DEFINITION_SLUG),
      year === null
        ? Promise.resolve(null)
        : findCampaignDeadline(actualisationCampaignDefinitionSlug(year)),
    ]
  );

  const { total, rows: pageRows } = paginateDashboardRows(rows, page);

  return {
    initialisationDeadline:
      initialisationDefinition?.deadline?.toISOString() ?? null,
    actualisationDeadline:
      actualisationDefinition?.deadline?.toISOString() ?? null,
    total,
    rows: pageRows,
  };
};
