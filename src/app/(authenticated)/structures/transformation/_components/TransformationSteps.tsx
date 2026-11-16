import { useCanUpdateDepartement } from "@/app/hooks/useCanUpdateStructure";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { getTransformationStepsWithStatus } from "@/utils/transformation-step-status.util";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ transformation }: Props) => {
  const canUpdateDepartement = useCanUpdateDepartement();

  if (!transformation) {
    return null;
  }

  const steps = getTransformationStepsWithStatus(
    transformation,
    canUpdateDepartement
  );

  return (
    <div className="flex flex-col gap-4 mt-6">
      {steps.map((step) => (
        <TransformationStep key={step.id} step={step} />
      ))}
    </div>
  );
};

type Props = {
  transformation: TransformationApiRead | undefined;
};
