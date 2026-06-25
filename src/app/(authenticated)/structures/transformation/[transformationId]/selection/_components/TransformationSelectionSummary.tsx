import { TransformationStructureIcon } from "@/app/components/transformations/TransformationStructureIcon";
import {
  getStructureVersionTransformationGroupLabel,
  sortStructureVersionTransformationsByType,
} from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import { TransformationSelectionSummaryItem } from "./TransformationSelectionSummaryItem";

type Props = {
  structureVersionTransformations: StructureVersionTransformationApiRead[];
};

type Group = {
  type: StructureVersionTransformationType;
  items: StructureVersionTransformationApiRead[];
};

export const TransformationSelectionSummary = ({
  structureVersionTransformations,
}: Props) => {
  const groups = groupByType(structureVersionTransformations);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div
          key={group.type}
          className="bg-white p-6 rounded-lg flex flex-col gap-6"
        >
          <div className="flex items-center gap-2 text-title-blue-france font-bold">
            <TransformationStructureIcon type={group.type} />
            <span>
              {getStructureVersionTransformationGroupLabel(
                group.type,
                group.items.length
              )}
            </span>
          </div>
          {group.items.map((structureVersionTransformation) => (
            <TransformationSelectionSummaryItem
              key={structureVersionTransformation.id}
              structureVersionTransformation={structureVersionTransformation}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const groupByType = (
  structureVersionTransformations: StructureVersionTransformationApiRead[]
): Group[] => {
  return sortStructureVersionTransformationsByType(
    structureVersionTransformations
  ).reduce<Group[]>((accumulator, structureVersionTransformation) => {
    const lastGroup = accumulator[accumulator.length - 1];
    if (lastGroup && lastGroup.type === structureVersionTransformation.type) {
      lastGroup.items.push(structureVersionTransformation);
      return accumulator;
    }
    accumulator.push({
      type: structureVersionTransformation.type,
      items: [structureVersionTransformation],
    });
    return accumulator;
  }, []);
};
