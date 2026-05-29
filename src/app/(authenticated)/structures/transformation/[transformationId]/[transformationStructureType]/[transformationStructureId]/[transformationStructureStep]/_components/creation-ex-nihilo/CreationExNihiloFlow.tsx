"use client";

import { useParams } from "next/navigation";

import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureTransformationStep } from "@/types/transformation.type";

import { CreationExNihiloActesAdministratifsForm } from "./CreationExNihiloActesAdministratifsForm";
import { CreationExNihiloIdentificationForm } from "./CreationExNihiloIdentificationForm";

type Props = {
  structureTransformation: StructureTransformationApiRead;
  transformation: TransformationApiRead;
};

export const CreationExNihiloFlow = ({
  structureTransformation,
  transformation,
}: Props) => {
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
      <CreationExNihiloActesAdministratifsForm
        structureTransformation={structureTransformation}
        transformation={transformation}
      />
    );
  }

  return null;
};
