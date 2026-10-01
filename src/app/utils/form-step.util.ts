import { StepStatus } from "@/types/form.type";

export const areAllFormStepsValidated = (
  formSteps: { status: string }[] | undefined
): boolean =>
  !!formSteps &&
  formSteps.every((formStep) => formStep.status === StepStatus.VALIDE);
