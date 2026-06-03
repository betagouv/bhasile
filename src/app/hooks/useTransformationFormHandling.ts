import { useRouter } from "next/navigation";

import { StructureTransformationApiUpdateClient } from "@/schemas/api/transformation.schema";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
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

  const handleValidation = async ({
    transformationId,
    structureTransformation,
  }: {
    transformationId: number;
    structureTransformation: StructureTransformationApiUpdateClient;
  }) => {
    try {
      await updateTransformation(
        transformationId,
        {
          id: transformationId,
          structureTransformations: [structureTransformation],
        },
        setTransformation
      );
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
  };
};
