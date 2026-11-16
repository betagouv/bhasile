import { useTransformationStepsWithStatus } from "@/hooks/useTransformationStepsWithStatus";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ transformation }: Props) => {
  const steps = useTransformationStepsWithStatus(transformation);

  if (!transformation) {
    return null;
  }

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
