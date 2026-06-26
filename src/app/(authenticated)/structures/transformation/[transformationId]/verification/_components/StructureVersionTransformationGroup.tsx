import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
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
        <StructureEventIcon kind={type} />
        <span>{getGroupLabel(type, structureVersionTransformations.length)}</span>
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

const getGroupLabel = (
  type: StructureVersionTransformationType,
  count: number
): string => {
  const isPlural = count > 1;
  switch (type) {
    case StructureVersionTransformationType.CREATION:
      return isPlural ? "Nouvelles structures" : "Nouvelle structure";
    case StructureVersionTransformationType.EXTENSION:
      return isPlural ? "Extensions" : "Extension";
    case StructureVersionTransformationType.CONTRACTION:
      return isPlural ? "Contractions" : "Contraction";
    case StructureVersionTransformationType.FERMETURE:
      return isPlural ? "Fermetures" : "Fermeture";
  }
};
