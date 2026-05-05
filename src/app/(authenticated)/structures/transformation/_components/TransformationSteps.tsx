import { useFetchTransformation } from "@/app/hooks/useFetchTransformation";

import { TransformationStep } from "./TransformationStep";

export const TransformationSteps = ({ idTransformation }: Props) => {
  const { transformation } = useFetchTransformation(
    idTransformation ? Number(idTransformation) : undefined
  );

  if (!transformation) {
    return null;
  }

  return (
    <div>
      {transformation.structureTransformations?.map(
        (structureTransformation) => (
          <TransformationStep
            key={structureTransformation.id}
            structureTransformation={structureTransformation}
          />
        )
      )}
    </div>
  );
};

type Props = {
  idTransformation: number | undefined;
};
