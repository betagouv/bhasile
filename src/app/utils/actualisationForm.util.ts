import { getActualisationFormSlug } from "@/app/api/forms/form.constants";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { areAllFormStepsValidated } from "./formStep.util";

export const ACTUALISATION_STEPS: ActualisationStep[] = [
  { route: "01-places" },
  { route: "02-documents-financiers" },
  { route: "03-analyse-financiere" },
  { route: "04-actes-administratifs" },
];

export const findActualisationForm = <
  TForm extends { formDefinition: { slug: string } },
>(
  forms: TForm[] | undefined,
  year: number
): TForm | undefined =>
  forms?.find(
    (form) => form.formDefinition.slug === getActualisationFormSlug(year)
  );

export const hasOpenActualisation = (
  forms: ActualisationStatusForm[] | undefined,
  year: number
): boolean => {
  const form = findActualisationForm(forms, year);
  return !!form && !form.status;
};

export const hasValidatedActualisation = (
  forms: ActualisationStatusForm[] | undefined,
  year: number
): boolean => {
  const form = findActualisationForm(forms, year);
  return !!form && form.status;
};

export const getActualisationFormStepStatus = (
  route: string,
  structure: StructureApiRead,
  year: number
): StepStatus => {
  const form = findActualisationForm(structure.forms, year);
  const formStep = form?.formSteps.find(
    (step) => step.stepDefinition.slug === route
  );
  return formStep?.status ?? StepStatus.NON_COMMENCE;
};

export const isActualisationReadyToValidate = (
  structure: StructureApiRead,
  year: number
): boolean =>
  areAllFormStepsValidated(
    findActualisationForm(structure.forms, year)?.formSteps
  );

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

export type ActualisationStatusForm = {
  status: boolean;
  formDefinition: { slug: string };
  formSteps: { status: string }[];
};

type ActualisationStep = {
  route: string;
};
