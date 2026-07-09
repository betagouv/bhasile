import {
  actualisationCampaignDefinitionSlug,
  INITIALISATION_CAMPAIGN_DEFINITION_SLUG,
} from "@/app/api/campaigns/campaign.constants";
import { getActualisationYear } from "@/app/api/campaigns/campaign.util";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import { buildStructureCampaigns } from "@/app/api/structures/structure.util";
import { paginateRows, sortRows } from "@/app/utils/list.util";
import { parseCommaList } from "@/app/utils/string.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { Filters } from "@/types/filters.type";
import { SessionUser } from "@/types/global";

import {
  findCampaignDeadline,
  findDashboardStructures,
} from "./initialisations-actualisations.repository";
import {
  DashboardStructureRow,
  InitialisationsActualisationsApiRead,
} from "./initialisations-actualisations.type";
import {
  getActualisationStatus,
  getInitialisationStatus,
  getMostUrgentActionUrl,
  isOpen,
} from "./initialisations-actualisations.util";

export const getInitialisationsActualisations = async (
  filters: Filters,
  user: SessionUser | undefined,
  page: number
): Promise<InitialisationsActualisationsApiRead> => {
  const now = new Date();
  const year = getActualisationYear();

  const allowedDepartements = user?.allowedDepartements ?? [];
  const typeList = parseCommaList(filters.type);
  const departementList = parseCommaList(filters.departements);
  const operateurList = parseCommaList(filters.operateurs);

  const structures = await findDashboardStructures();

  const rows: DashboardStructureRow[] = [];

  for (const structure of structures) {
    const currentVersion = resolveCurrentVersion(
      structure.structureVersions,
      now
    );
    if (!currentVersion) {
      continue;
    }

    const isClosed =
      currentVersion.structureVersionTransformation?.type ===
      StructureVersionTransformationType.FERMETURE;
    if (isClosed) {
      continue;
    }

    const departement = currentVersion.departementAdministratif;
    if (departement === null || !allowedDepartements.includes(departement)) {
      continue;
    }
    if (departementList.length > 0 && !departementList.includes(departement)) {
      continue;
    }

    const operateurId = structure.operateur?.id ?? null;
    if (
      operateurList.length > 0 &&
      (operateurId === null || !operateurList.includes(String(operateurId)))
    ) {
      continue;
    }

    const type = structure.type;
    if (typeList.length > 0 && (type === null || !typeList.includes(type))) {
      continue;
    }

    const initialisationStatus = getInitialisationStatus(structure.forms);
    const campaigns = buildStructureCampaigns(structure.structureVersions);
    const actualisationStatus = getActualisationStatus(campaigns, year);

    if (!isOpen(initialisationStatus, actualisationStatus)) {
      continue;
    }

    rows.push({
      id: structure.id,
      codeBhasile: structure.codeBhasile,
      type,
      operateurName: structure.operateur?.name ?? null,
      communeAdministrative: currentVersion.communeAdministrative,
      departementAdministratif: departement,
      initialisationStatus,
      actualisationStatus,
      actionUrl: getMostUrgentActionUrl(
        structure.id,
        initialisationStatus,
        actualisationStatus,
        year
      ),
    });
  }

  const sortedRows = sortRows(
    rows,
    (row) => ({ value: row.codeBhasile, kind: "text" }),
    (row) => ({ value: row.id, kind: "number" }),
    "asc"
  );

  const [initialisationDefinition, actualisationDefinition] = await Promise.all(
    [
      findCampaignDeadline(INITIALISATION_CAMPAIGN_DEFINITION_SLUG),
      year === null
        ? Promise.resolve(null)
        : findCampaignDeadline(actualisationCampaignDefinitionSlug(year)),
    ]
  );

  const total = sortedRows.length;
  const lastPage = Math.max(0, Math.ceil(total / MIDDLE_PAGE_SIZE) - 1);
  const pageRows = paginateRows(
    sortedRows,
    Math.min(page, lastPage),
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
