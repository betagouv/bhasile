"use client";

import { useParams } from "next/navigation";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationStep } from "@/types/transformation.type";

import { CreationExNihiloIdentificationForm } from "./CreationExNihiloIdentificationForm";
import { CreationExNihiloPlacesEtHebergementForm } from "./CreationExNihiloPlacesEtHebergementForm";

type Props = {
  transformation: TransformationApiRead;
};

export const CreationExNihiloFlow = ({ transformation }: Props) => {
  const { transformationStructureStep } = useParams();

  if (transformationStructureStep === StructureTransformationStep.DESCRIPTION) {
    return (
      <CreationExNihiloIdentificationForm transformation={transformation} />
    );
  }

  if (
    transformationStructureStep ===
    StructureTransformationStep.PLACES_ET_HEBERGEMENT
  ) {
    return (
      <CreationExNihiloPlacesEtHebergementForm transformation={transformation} />
    );
  }

  return null;
};
