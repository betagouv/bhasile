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
