import { TransformationApiRead } from "@/schemas/api/transformation.schema";

export const getTransformationSteps = (
  transformation: TransformationApiRead | undefined
) => {
  if (!transformation) {
    return [];
  }

  return transformation.structureTransformations.map(
    (structureTransformation) => {
      return {
        id: structureTransformation.id,
        type: structureTransformation.type,
      };
    }
  );
};
