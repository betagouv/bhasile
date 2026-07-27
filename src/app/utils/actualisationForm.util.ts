import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import {
  StructureApiRead,
  StructureCampaignApiRead,
} from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

export const ACTUALISATION_STEPS: ActualisationStep[] = [
  { route: "01-places" },
  { route: "02-documents-financiers" },
  { route: "03-analyse-financiere" },
  { route: "04-actes-administratifs" },
];

export const getActualisationCampaign = (
  structure: StructureApiRead,
  year: number
): StructureCampaignApiRead | undefined =>
  structure.campaigns.find(
    (campaign) => campaign.slug === actualisationCampaignDefinitionSlug(year)
  );

export const getActualisationFormStepStatus = (
  route: string,
  structure: StructureApiRead,
  year: number
): StepStatus => {
  const campaign = getActualisationCampaign(structure, year);
  const formStep = campaign?.formSteps.find((step) => step.slug === route);
  return formStep?.status ?? StepStatus.NON_COMMENCE;
};

export const isActualisationReadyToValidate = (
  structure: StructureApiRead,
  year: number
): boolean => {
  const campaign = getActualisationCampaign(structure, year);
  return (
    !!campaign &&
    campaign.formSteps.length > 0 &&
    campaign.formSteps.every((step) => step.status === StepStatus.VALIDE)
  );
};

export const getActualisationNextRoute = (
  route: string
): string | undefined => {
  const currentIndex = ACTUALISATION_STEPS.findIndex(
    (step) => step.route === route
  );
  if (currentIndex === -1 || currentIndex === ACTUALISATION_STEPS.length - 1) {
    return undefined;
  }
  return ACTUALISATION_STEPS[currentIndex + 1].route;
};

type ActualisationStep = {
  route: string;
};
