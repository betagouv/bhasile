"use client";

import { useCanUpdateDepartement } from "@/app/hooks/useCanUpdateStructure";
import { Step } from "@/app/utils/transformation.util";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { getTransformationStepsWithStatus } from "@/utils/transformation-step-status.util";

export const useTransformationStepsWithStatus = (
  transformation?: TransformationApiRead
): Step[] =>
  getTransformationStepsWithStatus(transformation, useCanUpdateDepartement());
