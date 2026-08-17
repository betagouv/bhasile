import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import {
  isStructureClosed,
  isStructureFinalised,
} from "@/app/api/structures/structure.util";
import {
  ActualisationStatusForm,
  findActualisationForm,
} from "@/app/utils/actualisationForm.util";
import { sortRows } from "@/app/utils/list.util";
import {
  ActualisationStatus,
  DashboardStructureRow,
  InitialisationStatus,
} from "@/types/dashboard.type";
import { SessionUser } from "@/types/global";

import { isStructureInDashboardScope } from "../dashboard.util";
import { DashboardStructure } from "./initialisations-actualisations.db.type";

export const getInitialisationStatus = (
  structure: {
    forms: { status: boolean; formDefinition: { slug: string } }[];
    structureVersions: Parameters<typeof isStructureFinalised>[0]["structureVersions"];
  },
  now: Date
): InitialisationStatus => {
  if (isStructureFinalised(structure, now)) {
    return "FINALISEE";
  }

  const hasFinalisationForm = structure.forms.some(
    (form) => form.formDefinition.slug === FINALISATION_FORM_SLUG
  );

  return hasFinalisationForm ? "A_FINALISER" : "A_INITIALISER";
};

export const getActualisationStatus = (
  forms: ActualisationStatusForm[],
  year: number | null
): ActualisationStatus => {
  if (year === null) {
    return "A_DEBUTER";
  }
  const form = findActualisationForm(forms, year);
  if (!form) {
    return "A_DEBUTER";
  }
  if (form.status) {
    return "FINALISEE";
  }
  const hasStartedStep = form.formSteps.some(
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

    if (isStructureClosed(structure, options.now)) {
      continue;
    }

    if (!isStructureInDashboardScope(structure, options)) {
      continue;
    }

    const initialisationStatus = getInitialisationStatus(
      structure,
      options.now
    );
    const actualisationStatus = getActualisationStatus(
      structure.forms,
      options.year
    );

    if (!isOpen(initialisationStatus, actualisationStatus)) {
      continue;
    }

    rows.push({
      id: structure.id,
      codeBhasile: structure.codeBhasile,
      type: structure.type,
      operateurName: structure.operateur?.name ?? null,
      communeAdministrative: currentVersion.communeAdministrative,
      departementAdministratif: currentVersion.departementAdministratif,
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
