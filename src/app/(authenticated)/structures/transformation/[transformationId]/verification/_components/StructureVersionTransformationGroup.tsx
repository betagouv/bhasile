import { TransformationStructureIcon } from "@/app/components/transformations/TransformationStructureIcon";
import { getStructureVersionTransformationGroupLabel } from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import { StructureVersionTransformationItem } from "./StructureVersionTransformationItem";

type Props = {
  type: StructureVersionTransformationType;
  structureVersionTransformations: StructureVersionTransformationApiRead[];
};

export const StructureVersionTransformationGroup = ({
  type,
  structureVersionTransformations,
}: Props) => {
  return (
    <div className="bg-white p-6 rounded-lg flex flex-col gap-6">
      <div className="flex items-center gap-2 text-title-blue-france font-bold">
        <TransformationStructureIcon type={type} />
        <span>
          {getStructureVersionTransformationGroupLabel(
            type,
            structureVersionTransformations.length
          )}
        </span>
      </div>
      {structureVersionTransformations.map((structureVersionTransformation) => (
        <StructureVersionTransformationItem
          key={structureVersionTransformation.id}
          structureVersionTransformation={structureVersionTransformation}
        />
      ))}
    </div>
  );
};
