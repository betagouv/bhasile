"use client";

import { useParams } from "next/navigation";

import { getStructureVersionTransformationFormKind } from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationStep } from "@/types/transformation.type";

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

  const formKind = getStructureVersionTransformationFormKind(
    transformation.type,
    structureVersionTransformation.type
  );

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
