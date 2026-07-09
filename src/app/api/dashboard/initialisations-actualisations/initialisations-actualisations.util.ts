import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";

import {
  ActualisationStatus,
  InitialisationStatus,
} from "./initialisations-actualisations.type";

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
  // À initialiser = au tour de l'opérateur, l'agent n'a pas d'action à mener.
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
