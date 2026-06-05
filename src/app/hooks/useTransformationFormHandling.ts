import { useRouter } from "next/navigation";

import { StructureVersionTransformationApiUpdateClient } from "@/schemas/api/transformation.schema";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { validateStructureVersionTransformationFormStep } from "../utils/transformation.util";
import { useTransformationFormNavigation } from "./useTransformationFormNavigation";
import { useTransformations } from "./useTransformations";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const { setTransformation } = useTransformationContext();
  const { updateTransformation } = useTransformations();

  const { firstStep, currentStep, nextStep, prevStep } =
    useTransformationFormNavigation();

  if (!currentStep) {
    router.replace(firstStep.route);
  }

  const handleSave = async ({
    transformationId,
    structureVersionTransformation,
  }: {
    transformationId: number;
    structureVersionTransformation: StructureVersionTransformationApiUpdateClient;
  }) => {
    await updateTransformation(
      transformationId,
      {
        id: transformationId,
        structureVersionTransformations: [structureVersionTransformation],
      },
      setTransformation
    );
  };

  const handleValidation = async ({
    transformationId,
    structureVersionTransformation,
  }: {
    transformationId: number;
    structureVersionTransformation: StructureVersionTransformationApiUpdateClient;
  }) => {
    if (!currentStep) {
      return;
    }

    try {
      await handleSave({
        transformationId,
        structureVersionTransformation: {
          ...structureVersionTransformation,
          form: structureVersionTransformation.form
            ? validateStructureVersionTransformationFormStep(
                structureVersionTransformation.form,
                currentStep.name
              )
            : structureVersionTransformation.form,
        },
      });
      if (nextStep) {
        router.push(nextStep.route);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    nextStep,
    prevStep,
    handleValidation,
    handleSave,
  };
};
