import { FormApiType, FormStepApiType } from "@/schemas/api/form.schema";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

export const FINALISATION_FORM_LABEL = "finalisation";
export const FINALISATION_FORM_VERSION = 1;
export const FINALISATION_STEPS: FinalisationStep[] = [
  {
    route: "01-identification",
    type: "verification",
  },
  {
    route: "02-documents-financiers",
    type: "verification",
  },
  {
    route: "03-finance",
    type: "completion",
  },
  {
    route: "04-controles",
    type: "completion",
  },
  {
    route: "05-documents",
    type: "completion",
  },
  {
    route: "06-notes",
    type: "completion",
  },
];

export const getFinalisationForm = (
  structure: StructureApiType
): FormApiType | undefined => {
  return structure.forms?.find(
    (form) =>
      form.formDefinition.name === FINALISATION_FORM_LABEL &&
      form.formDefinition.version === FINALISATION_FORM_VERSION
  );
};

export const getFinalisationFormStatus = (
  structure: StructureApiType
): boolean => {
  const finalisationForm = getFinalisationForm(structure);

  if (!finalisationForm) {
    return false;
  }

  return finalisationForm.status;
};

export const getFinalisationFormStepStatus = (
  route: string,
  structure: StructureApiType
) => {
  const finalisationForm = getFinalisationForm(structure);

  if (!finalisationForm) {
    return StepStatus.NON_COMMENCE;
  }

  const currentFormStep = finalisationForm.formSteps?.find((step) => {
    return step.stepDefinition.slug === route;
  });

  if (!currentFormStep) {
    return StepStatus.NON_COMMENCE;
  }

  return currentFormStep.status;
};

export const getFinalisationFormNextStepToValidate = (
  structure: StructureApiType,
  route?: string
): FormStepApiType | undefined => {
  if (!route) {
    return undefined;
  }

  const finalisationForm = getFinalisationForm(structure);

  if (!finalisationForm) {
    return undefined;
  }

  const currentStepIndex = FINALISATION_STEPS.findIndex(
    (step) => step.route === route
  );

  if (
    !finalisationForm.formSteps ||
    currentStepIndex === -1 ||
    currentStepIndex === FINALISATION_STEPS.length - 1
  ) {
    return undefined;
  }

  return FINALISATION_STEPS.slice(currentStepIndex + 1)
    .map((step) =>
      finalisationForm.formSteps.find(
        (formStep) => formStep.stepDefinition.slug === step.route
      )
    )
    .find(
      (nextFormStep) =>
        nextFormStep && nextFormStep.status !== StepStatus.VALIDE
    );
};

type FinalisationStep = {
  route: string;
  type: "verification" | "completion";
};
