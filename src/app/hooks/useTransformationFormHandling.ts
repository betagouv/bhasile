import { useParams, useRouter } from "next/navigation";

import { StructureTransformationType } from "@/types/transformation.type";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import {
  getTransformationFormNavigation,
  getTransformationSteps,
} from "../utils/transformation.util";

export const useTransformationFormHandling = () => {
  const router = useRouter();

  const params = useParams();

  const transformationStructureType =
    params.transformationStructureType as StructureTransformationType;
  const transformationStructureId = Number(params.transformationStructureId);
  const transformationStructureStep = String(
    params.transformationStructureStep
  );

  const { transformation } = useTransformationContext();

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

  return {
    nextStep,
    prevStep,
  };
};
