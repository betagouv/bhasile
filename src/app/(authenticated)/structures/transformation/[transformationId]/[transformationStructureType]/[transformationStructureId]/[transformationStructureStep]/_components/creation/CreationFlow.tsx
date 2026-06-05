"use client";

import { useParams } from "next/navigation";

import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureTransformationStep,
  TransformationType,
} from "@/types/transformation.type";

import { TransformationActesAdministratifsForm } from "../shared/TransformationActesAdministratifsForm";
import { CreationIdentificationForm } from "./CreationIdentificationForm";
import { CreationPlacesEtHebergementForm } from "./CreationPlacesEtHebergementForm";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const CreationFlow = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { transformationStructureStep } = useParams();

  const formKind =
    transformation.type === TransformationType.OUVERTURE_EX_NIHILO
      ? FormKind.OUVERTURE_EX_NIHILO
      : FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

  if (transformationStructureStep === StructureTransformationStep.DESCRIPTION) {
    return (
      <CreationIdentificationForm
        transformation={transformation}
        structureTransformation={structureTransformation}
        formKind={formKind}
      />
    );
  }

  if (
    transformationStructureStep ===
    StructureTransformationStep.PLACES_ET_HEBERGEMENT
  ) {
    return (
      <CreationPlacesEtHebergementForm
        transformation={transformation}
        structureTransformation={structureTransformation}
      />
    );
  }

  if (
    transformationStructureStep ===
    StructureTransformationStep.ACTES_ADMINISTRATIFS
  ) {
    return (
      <TransformationActesAdministratifsForm
        transformation={transformation}
        structureTransformation={structureTransformation}
      />
    );
  }

  return null;
};
