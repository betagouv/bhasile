"use client";

import { useParams } from "next/navigation";

import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureTransformationStep } from "@/types/transformation.type";

import { CreationExNihiloActesAdministratifsForm } from "./CreationExNihiloActesAdministratifsForm";
import { CreationExNihiloIdentificationForm } from "./CreationExNihiloIdentificationForm";
import { CreationExNihiloPlacesEtHebergementForm } from "./CreationExNihiloPlacesEtHebergementForm";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const CreationExNihiloFlow = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { transformationStructureStep } = useParams();

  if (transformationStructureStep === StructureTransformationStep.DESCRIPTION) {
    return (
      <CreationExNihiloIdentificationForm
        transformation={transformation}
        structureTransformation={structureTransformation}
      />
    );
  }

  if (
    transformationStructureStep ===
    StructureTransformationStep.PLACES_ET_HEBERGEMENT
  ) {
    return (
      <CreationExNihiloPlacesEtHebergementForm
        transformation={transformation}
        structureTransformation={structureTransformation}
      />
    );
  }

  return null;
};
