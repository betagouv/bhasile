import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StructureVersionTransformationApiUpdateClient } from "@/schemas/api/transformation.schema";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { validateStructureVersionTransformationFormStep } from "../utils/transformation.util";
import { useTransformationFormNavigation } from "./useTransformationFormNavigation";
import { useTransformations } from "./useTransformations";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const { transformation, setTransformation } = useTransformationContext();
  const { updateTransformation } = useTransformations();

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

    const currentStructureVersionTransformation =
      transformation.structureVersionTransformations.find(
        (structureVersionTransformationItem) =>
          structureVersionTransformationItem.id === currentStep.id
      );

    try {
      await handleSave({
        transformationId,
        structureVersionTransformation: {
          ...structureVersionTransformation,
          form:
            currentStructureVersionTransformation?.form &&
            validateStructureVersionTransformationFormStep(
              currentStructureVersionTransformation.form,
              currentStep.name
            ),
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
    backLink,
    handleValidation,
    handleSave,
  };
};
