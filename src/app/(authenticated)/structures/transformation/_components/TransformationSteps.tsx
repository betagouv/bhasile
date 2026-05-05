import { useFetchTransformation } from "@/app/hooks/useFetchTransformation";
import { getTransformationSteps } from "@/app/utils/transformation.util";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ transformationId }: Props) => {
  const { transformation } = useFetchTransformation(
    transformationId ? Number(transformationId) : undefined
  );

  if (!transformation) {
    return null;
  }

  const steps = getTransformationSteps(transformation);

  return (
    <div className="flex flex-col gap-4 mt-6">
      {steps.map((step) => (
        <TransformationStep key={step.id} step={step} />
      ))}
    </div>
  );
};

type Props = {
  transformationId: number | undefined;
};
