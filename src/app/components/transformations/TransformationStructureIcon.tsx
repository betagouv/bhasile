import Image from "next/image";

import { cn } from "@/app/utils/classname.util";
import { StructureTransformationType } from "@/types/transformation.type";

export const TransformationStructureIcon = ({ type, large }: Props) => {
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return (
        <i
          className={cn(
            "ri-expand-diagonal-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureTransformationType.CONTRACTION:
      return (
        <i
          className={cn(
            "ri-collapse-diagonal-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureTransformationType.CREATION:
      return (
        <i
          className={cn(
            "fr-icon-add-line",
            large ? "fr-icon--md" : "fr-icon--sm"
          )}
        />
      );
    case StructureTransformationType.FERMETURE:
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
  type?: StructureTransformationType;
  large?: boolean;
};
