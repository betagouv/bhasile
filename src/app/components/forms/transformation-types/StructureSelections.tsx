import { useEffect, useRef } from "react";

import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export const StructureSelections = ({
  transformationType,
  structureId,
  structureTransformations,
  setStructureTransformations,
}: Props) => {
  const previousTransformationType =
    useRef<TransformationType>(transformationType);
  useEffect(() => {
    if (previousTransformationType.current !== transformationType) {
      previousTransformationType.current = transformationType;
      setStructureTransformations(
        getInitialStructureTransformations(structureId, transformationType)
      );
    }
  }, [structureId, transformationType, setStructureTransformations]);

  return <div>StructureSelections</div>;
};

type Props = {
  transformationType: TransformationType;
  structureId?: number;
  structureTransformations: StructureTransformationApiType[];
  setStructureTransformations: (
    structureTransformations: StructureTransformationApiType[]
  ) => void;
};

const getStructuresSelectionBlocks = (
  transformationType?: TransformationType
): {
  multiple: boolean;
  type: StructureTransformationType;
  fixedType?: StructureType;
}[] => {
  switch (transformationType) {
    case TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
      return [
        {
          multiple: true,
          type: StructureTransformationType.FERMETURE,
        },
      ];
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
      return [
        {
          multiple: true,
          type: StructureTransformationType.CONTRACTION,
        },
      ];
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
      return [
        {
          multiple: true,
          type: StructureTransformationType.FERMETURE,
        },
      ];
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
      return [
        {
          multiple: true,
          type: StructureTransformationType.EXTENSION,
        },
      ];
    case TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR:
      return [
        {
          multiple: true,
          type: StructureTransformationType.FERMETURE,
          fixedType: StructureType.HUDA,
        },
        {
          multiple: false,
          type: StructureTransformationType.EXTENSION,
          fixedType: StructureType.CADA,
        },
      ];
    case TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR:
      return [
        {
          multiple: true,
          type: StructureTransformationType.FERMETURE,
          fixedType: StructureType.HUDA,
        },
      ];
    case TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES:
      return [
        {
          multiple: true,
          type: StructureTransformationType.FERMETURE,
          fixedType: StructureType.HUDA,
        },
      ];
    default:
      return [];
  }
};

const getInitialStructureTransformations = (
  structureId?: number,
  transformationType?: TransformationType
): StructureTransformationApiType[] => {
  if (!structureId) {
    return [];
  }
  switch (transformationType) {
    case TransformationType.EXTENSION_EX_NIHILO:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
      return [
        {
          structureId,
          type: StructureTransformationType.EXTENSION,
        },
      ];
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES:
      return [
        {
          structureId,
          type: StructureTransformationType.CONTRACTION,
        },
      ];
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    case TransformationType.FERMETURE_SANS_TRANSFERT:
      return [
        {
          structureId,
          type: StructureTransformationType.FERMETURE,
        },
      ];
    default:
      return [];
  }
};
