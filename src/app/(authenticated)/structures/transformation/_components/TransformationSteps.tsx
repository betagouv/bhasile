import { useFetchTransformation } from "@/app/hooks/useFetchTransformation";
import { getTransformationSteps } from "@/app/utils/transformation.util";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ idTransformation }: Props) => {
  const { transformation } = useFetchTransformation(
    idTransformation ? Number(idTransformation) : undefined
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
  idTransformation: number | undefined;
};
