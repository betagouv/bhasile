import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

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

  // TODO: use real data from context (pending PR1234)
  const [transformation] = useState({
    id: 5,
    type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
    structureTransformations: [
      {
        id: 1,
        structureId: 1001,
        type: StructureTransformationType.FERMETURE,
      },
      {
        id: 2,
        structureId: 1003,
        type: StructureTransformationType.EXTENSION,
      },
      {
        id: 3,
        structureId: 1002,
        type: StructureTransformationType.FERMETURE,
      },
      {
        id: 4,
        structureId: 1003,
        type: StructureTransformationType.CONTRACTION,
      },
      {
        id: 5,
        structureId: 1004,
        type: StructureTransformationType.CREATION,
      },
    ],
  });

  const transformationSteps = getTransformationSteps(transformation);

  const { nextStep, prevStep } = getTransformationFormNavigation({
    transformationSteps,
    transformationStructureType,
    transformationStructureId,
    transformationStructureStep,
  });

  if (!transformationStructureType || !transformationStructureId) {
    const firstRoute = transformationSteps[0].steps[0].route;
    router.replace(firstRoute);
  }

  return {
    nextStep,
    prevStep,
  };
};
