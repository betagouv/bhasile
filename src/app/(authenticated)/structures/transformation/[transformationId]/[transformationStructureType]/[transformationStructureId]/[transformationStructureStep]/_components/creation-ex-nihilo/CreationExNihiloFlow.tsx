"use client";

import { useParams } from "next/navigation";

import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationStep } from "@/types/transformation.type";

import { CreationExNihiloIdentificationForm } from "./CreationExNihiloIdentificationForm";

type Props = {
  structureTransformation: StructureTransformationApiRead;
};

export const CreationExNihiloFlow = ({ structureTransformation }: Props) => {
  const { transformationStructureStep } = useParams();

  if (transformationStructureStep === StructureTransformationStep.DESCRIPTION) {
    return (
      <CreationExNihiloIdentificationForm
        structureTransformation={structureTransformation}
      />
    );
  }

  return null;
};
