"use client";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { TRANSFORMATION_TYPE_SPECS } from "@/config/transformation.config";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { useTransformationContext } from "../_context/TransformationClientContext";

export default function TransformationSelectionsPage() {
  const { transformation } = useTransformationContext();

  const formType = getFormByType(transformation.type);

  const primaryStructureVersionTransformationType = transformation.type
    ? TRANSFORMATION_TYPE_SPECS[transformation.type]
        .primaryStructureVersionTransformationType
    : undefined;
  const primaryStructureVersionTransformation =
    primaryStructureVersionTransformationType &&
    transformation.structureVersionTransformations?.find(
      (structureVersionTransformation) =>
        structureVersionTransformation.type === primaryStructureVersionTransformationType
    );

  const handleSubmit = (
    transformationType: TransformationType,
    structureVersionTransformations: StructureVersionTransformationApiCreate[]
  ) => {
    console.log(transformationType, structureVersionTransformations);
  };
  return (
    <TransformationTypeForms
      formType={formType}
      structureId={
        primaryStructureVersionTransformation
          ? primaryStructureVersionTransformation.structureVersion?.structureId
          : undefined
      }
      initialTransformationType={transformation.type}
      initialStructureVersionTransformations={transformation.structureVersionTransformations}
      onSubmit={handleSubmit}
    />
  );
}

const getFormByType = (
  type?: TransformationType
): TransformationFormType | undefined => {
  switch (type) {
    case TransformationType.OUVERTURE_EX_NIHILO:
    case TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
      return TransformationFormType.CREATION;
    case TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES:
      return TransformationFormType.HUDA;
    case TransformationType.EXTENSION_EX_NIHILO:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES:
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    case TransformationType.FERMETURE_SANS_TRANSFERT:
    default:
      return undefined;
  }
};
