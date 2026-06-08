import { useParams, usePathname } from "next/navigation";

import { VERIFICATION_STEP_NAME } from "@/config/transformation.config";
import { StructureTransformationType } from "@/types/transformation.type";

import { useTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import {
  getTransformationFormNavigation,
  getTransformationSteps,
} from "../utils/transformation.util";

export const useTransformationFormNavigation = () => {
  const pathname = usePathname();
  const params = useParams();

  const { transformation } = useTransformationContext();

  const isOnVerificationPage = pathname.endsWith(`/${VERIFICATION_STEP_NAME}`);

  const transformationStructureType =
    params.transformationStructureType as StructureTransformationType;

  const transformationStructureId = Number(params.transformationStructureId);

  const transformationStructureStep = isOnVerificationPage
    ? VERIFICATION_STEP_NAME
    : String(params.transformationStructureStep);

  const transformationSteps = getTransformationSteps(transformation);

  return getTransformationFormNavigation({
    transformationSteps,
    transformationId: transformation.id,
    transformationStructureType,
    transformationStructureId,
    transformationStructureStep,
  });
};
