import { useParams, useRouter } from "next/navigation";

import { StructureTransformationApiUpdateClient } from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import {
  getTransformationFormNavigation,
  getTransformationSteps,
} from "../utils/transformation.util";
import { useTransformations } from "./useTransformations";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const params = useParams();

  const transformationStructureType =
    params.transformationStructureType as StructureTransformationType;
  const transformationStructureId = Number(params.transformationStructureId);
  const transformationStructureStep = String(
    params.transformationStructureStep
  );

  const { transformation, setTransformation } = useTransformationContext();
  const { updateTransformation } = useTransformations();

  const transformationSteps = getTransformationSteps(transformation);

  const { firstStep, currentStep, nextStep, prevStep } =
    getTransformationFormNavigation({
      transformationSteps,
      transformationStructureType,
      transformationStructureId,
      transformationStructureStep,
    });

  if (!currentStep) {
    router.replace(firstStep.route);
  }

  const handleSave = async ({
    transformationId,
    structureTransformation,
  }: {
    transformationId: number;
    structureTransformation: StructureTransformationApiUpdateClient;
  }) => {
    await updateTransformation(
      transformationId,
      {
        id: transformationId,
        structureTransformations: [structureTransformation],
      },
      setTransformation
    );
  };

  const handleValidation = async ({
    transformationId,
    structureTransformation,
  }: {
    transformationId: number;
    structureTransformation: StructureTransformationApiUpdateClient;
  }) => {
    try {
      await handleSave({ transformationId, structureTransformation });
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
