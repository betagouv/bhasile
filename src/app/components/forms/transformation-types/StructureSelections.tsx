import { useEffect, useRef } from "react";

import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export const StructureSelections = ({
  transformationType,
  structureTransformations,
  setStructureTransformations,
}: Props) => {
  const previousTransformationType =
    useRef<TransformationType>(transformationType);
  useEffect(() => {
    if (previousTransformationType.current !== transformationType) {
      previousTransformationType.current = transformationType;
      if (shouldKeepFirstStructure(transformationType)) {
        setStructureTransformations([structureTransformations[0]]);
      } else {
        setStructureTransformations([]);
      }
    }
  }, [
    transformationType,
    structureTransformations,
    setStructureTransformations,
  ]);

  return <div>StructureSelections</div>;
};

type Props = {
  transformationType: TransformationType;
  structureTransformations: StructureTransformationApiType[];
  setStructureTransformations: (
    structureTransformations: StructureTransformationApiType[]
  ) => void;
};

const shouldKeepFirstStructure = (transformationType?: TransformationType) => {
  switch (transformationType) {
    case TransformationType.EXTENSION_EX_NIHILO:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES:
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    case TransformationType.FERMETURE_SANS_TRANSFERT:
      return true;
    default:
      return false;
  }
};
