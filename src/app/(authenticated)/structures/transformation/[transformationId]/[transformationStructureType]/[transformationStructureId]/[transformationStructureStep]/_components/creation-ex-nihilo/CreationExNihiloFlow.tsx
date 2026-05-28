"use client";

import { useParams } from "next/navigation";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationStep } from "@/types/transformation.type";

import { CreationExNihiloActesAdministratifsForm } from "./CreationExNihiloActesAdministratifsForm";
import { CreationExNihiloIdentificationForm } from "./CreationExNihiloIdentificationForm";

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
    StructureTransformationStep.ACTES_ADMINISTRATIFS
  ) {
    return (
      <CreationExNihiloActesAdministratifsForm transformation={transformation} />
    );
  }

  return null;
};
