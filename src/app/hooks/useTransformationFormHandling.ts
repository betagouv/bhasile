import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";

import { StructureVersionTransformationApiUpdateClient } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { setStructureVersionTransformationFormStepStatus } from "../utils/transformation.util";
import { useTransformationFormNavigation } from "./useTransformationFormNavigation";
import { useTransformationNavigateWithSave } from "./useTransformationNavigateWithSave";
import { useTransformations } from "./useTransformations";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const { transformation, setTransformation, shouldShowIncompleteSteps } =
    useTransformationContext();
  const { updateTransformation } = useTransformations();
  const { navigateWithSave } = useTransformationNavigateWithSave();

  const { firstStep, currentStep, nextStep, backLink } =
    useTransformationFormNavigation();

  useEffect(() => {
    if (!currentStep) {
      router.replace(firstStep.route);
    }
  }, [currentStep, firstStep.route, router]);

  const handleSave = async ({
    transformationId,
    structureVersionTransformation,
    strictSchema,
    values,
  }: {
    transformationId: number;
    structureVersionTransformation: StructureVersionTransformationApiUpdateClient;
    strictSchema: z.ZodTypeAny;
    values: unknown;
  }) => {
    const currentStructureVersionTransformation =
      transformation.structureVersionTransformations.find(
        (structureVersionTransformationItem) =>
          structureVersionTransformationItem.id === currentStep?.id
      );

    const stepStatus = strictSchema.safeParse(values).success
      ? StepStatus.VALIDE
      : StepStatus.COMMENCE;

    await updateTransformation(
      transformationId,
      {
        id: transformationId,
        structureVersionTransformations: [
          {
            ...structureVersionTransformation,
            form:
              currentStructureVersionTransformation?.form && currentStep
                ? setStructureVersionTransformationFormStepStatus(
                    currentStructureVersionTransformation.form,
                    currentStep.name,
                    stepStatus
                  )
                : structureVersionTransformation.form,
          },
        ],
      },
      setTransformation
    );
  };

  const goToNextStep = async () => {
    if (!currentStep || !nextStep) {
      return;
    }
    return navigateWithSave(nextStep.route);
  };

  return {
    nextStep,
    backLink,
    goToNextStep,
    navigateWithSave,
    handleSave,
    shouldShowIncompleteSteps,
  };
};
