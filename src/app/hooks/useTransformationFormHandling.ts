import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  StructureVersionTransformationApiUpdateClient,
  TransformationApiUpdateClient,
} from "@/schemas/api/transformation.schema";
import { AnyZodSchema, StepStatus } from "@/types/form.type";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { setStructureVersionTransformationFormStepStatus } from "../utils/transformation.util";
import { useSaveMutation } from "./useSaveMutation";
import { useTransformationFormNavigation } from "./useTransformationFormNavigation";
import { useTransformationNavigateWithSave } from "./useTransformationNavigateWithSave";
import { useTransformations } from "./useTransformations";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const { transformation, setTransformation, shouldShowIncompleteSteps } =
    useTransformationContext();
  const { updateTransformation } = useTransformations();
  const { navigateWithSave } = useTransformationNavigateWithSave();
  const { mutate: saveTransformation } = useSaveMutation(
    "transformation-save",
    (id: number, payload: TransformationApiUpdateClient) =>
      updateTransformation(id, payload, setTransformation)
  );

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
    strictSchema: AnyZodSchema;
    values: unknown;
  }): Promise<boolean> => {
    const currentStructureVersionTransformation =
      transformation.structureVersionTransformations.find(
        (structureVersionTransformationItem) =>
          structureVersionTransformationItem.id === currentStep?.id
      );

    const stepStatus = strictSchema.safeParse(values).success
      ? StepStatus.VALIDE
      : StepStatus.COMMENCE;

    const result = await saveTransformation(transformationId, {
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
    });
    return result !== null;
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
