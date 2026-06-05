import { TransformationStructureIcon } from "@/app/components/transformations/TransformationStructureIcon";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

import { StructureTransformationItem } from "./StructureTransformationItem";

type Props = {
  type: StructureTransformationType;
  structureTransformations: StructureTransformationApiRead[];
};

export const StructureTransformationGroup = ({
  type,
  structureTransformations,
}: Props) => {
  return (
    <div className="bg-white p-6 rounded-lg flex flex-col gap-6">
      <div className="flex items-center gap-2 text-title-blue-france font-bold">
        <TransformationStructureIcon type={type} />
        <span>{getGroupLabel(type, structureTransformations.length)}</span>
      </div>
      {structureTransformations.map((structureTransformation) => (
        <StructureTransformationItem
          key={structureTransformation.id}
          structureTransformation={structureTransformation}
        />
      ))}
    </div>
  );
};

const getGroupLabel = (
  type: StructureTransformationType,
  count: number
): string => {
  const isPlural = count > 1;
  switch (type) {
    case StructureTransformationType.CREATION:
      return isPlural ? "Nouvelles structures" : "Nouvelle structure";
    case StructureTransformationType.EXTENSION:
      return isPlural ? "Extensions" : "Extension";
    case StructureTransformationType.CONTRACTION:
      return isPlural ? "Contractions" : "Contraction";
    case StructureTransformationType.FERMETURE:
      return isPlural ? "Fermetures" : "Fermeture";
  }
};
