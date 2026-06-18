import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
import { getStructureVersionTransformationLabel } from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";

type Props = {
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const TransformationStructureHeader = ({
  structureVersionTransformation,
}: Props) => {
  return (
    <h1 className="relative flex items-center gap-3 pl-4 mb-4 text-xl font-bold text-title-blue-france">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-title-blue-france">
        <StructureEventIcon
          kind={structureVersionTransformation.type}
          large
        />
      </span>
      {getStructureVersionTransformationLabel(
        structureVersionTransformation.type,
        structureVersionTransformation.structureVersion?.structure?.codeBhasile
      )}
    </h1>
  );
};
