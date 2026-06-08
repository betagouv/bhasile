import Image from "next/image";

import { cn } from "@/app/utils/classname.util";
import { StructureVersionTransformationType } from "@/types/transformation.type";

export const TransformationStructureIcon = ({ type, large = false }: Props) => {
  switch (type) {
    case StructureVersionTransformationType.EXTENSION:
      return (
        <i
          className={cn(
            "ri-expand-diagonal-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureVersionTransformationType.CONTRACTION:
      return (
        <i
          className={cn(
            "ri-collapse-diagonal-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureVersionTransformationType.CREATION:
      return (
        <i
          className={cn(
            "fr-icon-add-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureVersionTransformationType.FERMETURE:
      return (
        <Image
          src="/transformation-fermeture.svg"
          alt=""
          aria-hidden="true"
          width={large ? 24 : 18}
          height={large ? 24 : 18}
        />
      );

    default:
      return null;
  }
};

type Props = {
  type?: StructureVersionTransformationType;
  large?: boolean;
};
