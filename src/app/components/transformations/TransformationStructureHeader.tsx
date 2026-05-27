import { getStructureTransformationLabel } from "@/app/utils/transformation.util";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationStructureIcon } from "./TransformationStructureIcon";

type Props = {
  structureTransformation: StructureTransformationApiRead;
};

export const TransformationStructureHeader = ({
  structureTransformation,
}: Props) => {
  return (
    <h1 className="relative flex items-center gap-3 pl-4 mb-4 text-xl font-bold text-title-blue-france">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-title-blue-france">
        <TransformationStructureIcon
          type={structureTransformation.type}
          large
        />
      </span>
      {getStructureTransformationLabel(
        structureTransformation.type,
        structureTransformation.structureVersion?.structure?.codeBhasile
      )}
    </h1>
  );
};
