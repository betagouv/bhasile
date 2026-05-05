import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";

export const TransformationStep = ({ structureTransformation }: Props) => {
  return (
    <div>
      {structureTransformation.type} {structureTransformation.structureId}
    </div>
  );
};

type Props = {
  structureTransformation: StructureTransformationApiType;
};
