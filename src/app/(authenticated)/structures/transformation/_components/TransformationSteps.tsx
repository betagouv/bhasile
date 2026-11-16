import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { getTransformationStepsWithStatus } from "@/utils/transformation-step-status.util";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ transformation }: Props) => {
  if (!transformation) {
    return null;
  }

  const steps = getTransformationStepsWithStatus(transformation);

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
