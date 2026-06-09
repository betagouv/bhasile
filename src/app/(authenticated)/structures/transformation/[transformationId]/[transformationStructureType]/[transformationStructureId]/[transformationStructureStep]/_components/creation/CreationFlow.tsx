"use client";

import { useParams } from "next/navigation";

import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  TransformationType,
} from "@/types/transformation.type";

import { PlacesEtHebergementForm } from "../shared/PlacesEtHebergementForm";
import { TransformationActesAdministratifsForm } from "../shared/TransformationActesAdministratifsForm";
import { CreationIdentificationForm } from "./CreationIdentificationForm";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const CreationFlow = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const { transformationStructureStep } = useParams();

  const formKind =
    transformation.type === TransformationType.OUVERTURE_EX_NIHILO
      ? FormKind.OUVERTURE_EX_NIHILO
      : FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

  if (transformationStructureStep === StructureVersionTransformationStep.DESCRIPTION) {
    return (
      <CreationIdentificationForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={formKind}
      />
    );
  }

  if (
    transformationStructureStep ===
    StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT
  ) {
    return (
      <PlacesEtHebergementForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={formKind}
      />
    );
  }

  if (
    transformationStructureStep ===
    StructureVersionTransformationStep.ACTES_ADMINISTRATIFS
  ) {
    return (
      <TransformationActesAdministratifsForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
      />
    );
  }

  return null;
};
