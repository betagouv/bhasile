import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import { buildStructureCampaigns } from "@/app/api/structures/structure.util";
import { paginateRows, sortRows } from "@/app/utils/list.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { canUpdateDepartement } from "@/lib/casl/abilities";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";
import {
  ActualisationStatus,
  DashboardStructureRow,
  InitialisationStatus,
} from "@/types/dashboard.type";
import { SessionUser } from "@/types/global";

import { DashboardStructure } from "./initialisations-actualisations.db.type";

export const getInitialisationStatus = (
  finalisationForms: { status: boolean }[]
): InitialisationStatus => {
  const finalisationForm = finalisationForms[0];
  if (!finalisationForm) {
    return "A_INITIALISER";
  }
  return finalisationForm.status ? "FINALISEE" : "A_FINALISER";
};

export const getActualisationStatus = (
  campaigns: StructureCampaignApiRead[],
  year: number | null
): ActualisationStatus => {
  if (year === null) {
    return "A_DEBUTER";
  }
  const campaign = campaigns.find(
    (candidate) => candidate.slug === actualisationCampaignDefinitionSlug(year)
  );
  if (!campaign) {
    return "A_DEBUTER";
  }
  if (campaign.isValidated) {
    return "FINALISEE";
  }
  const hasStartedStep = campaign.formSteps.some(
    (formStep) => formStep.status !== "NON_COMMENCE"
  );
  return hasStartedStep ? "EN_COURS" : "A_DEBUTER";
};

export const isOpen = (
  initialisationStatus: InitialisationStatus,
  actualisationStatus: ActualisationStatus
): boolean =>
  initialisationStatus !== "FINALISEE" || actualisationStatus !== "FINALISEE";

export const getMostUrgentActionUrl = (
  structureId: number,
  initialisationStatus: InitialisationStatus,
  actualisationStatus: ActualisationStatus,
  year: number | null
): string | null => {
  if (initialisationStatus === "A_INITIALISER") {
    return null;
  }
  if (initialisationStatus === "A_FINALISER") {
    return `/structures/${structureId}/finalisation/01-identification`;
  }
  if (actualisationStatus !== "FINALISEE" && year !== null) {
    return `/structures/${structureId}/actualisation/${year}/01-places`;
  }
  return null;
};

export type BuildDashboardRowsOptions = {
  user: SessionUser | undefined;
  typeList: string[];
  departementList: string[];
  operateurList: string[];
  year: number | null;
  now: Date;
};

export const buildDashboardRows = (
  structures: DashboardStructure[],
  options: BuildDashboardRowsOptions
): DashboardStructureRow[] => {
  const rows: DashboardStructureRow[] = [];

  for (const structure of structures) {
    const currentVersion = resolveCurrentVersion(
      structure.structureVersions,
      options.now
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
    if (
      departement === null ||
      !options.user ||
      !canUpdateDepartement(options.user, departement)
    ) {
      continue;
    }
    if (
      options.departementList.length > 0 &&
      !options.departementList.includes(departement)
    ) {
      continue;
    }

    const operateurId = structure.operateur?.id ?? null;
    if (
      options.operateurList.length > 0 &&
      (operateurId === null ||
        !options.operateurList.includes(String(operateurId)))
    ) {
      continue;
    }

    const type = structure.type;
    if (
      options.typeList.length > 0 &&
      (type === null || !options.typeList.includes(type))
    ) {
      continue;
    }

    const initialisationStatus = getInitialisationStatus(structure.forms);
    const campaigns = buildStructureCampaigns(structure.structureVersions);
    const actualisationStatus = getActualisationStatus(campaigns, options.year);

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
        options.year
      ),
    });
  }

  return sortRows(
    rows,
    (row) => ({ value: row.codeBhasile, kind: "text" }),
    (row) => ({ value: row.id, kind: "number" }),
    "asc"
  );
};

export const paginateDashboardRows = (
  rows: DashboardStructureRow[],
  page: number
): { total: number; rows: DashboardStructureRow[] } => {
  const total = rows.length;
  const lastPage = Math.max(0, Math.ceil(total / MIDDLE_PAGE_SIZE) - 1);
  return {
    total,
    rows: paginateRows(rows, Math.min(page, lastPage), MIDDLE_PAGE_SIZE),
  };
};
