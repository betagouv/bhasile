"use client";

import { useParams } from "next/navigation";

import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureTransformationStep,
  StructureTransformationType,
} from "@/types/transformation.type";

import { ExistingStructureIdentificationForm } from "./ExistingStructureIdentificationForm";

type Props = {
  transformation: TransformationApiRead;
  structureTransformation: StructureTransformationApiRead;
};

export const ExistingStructureFlow = ({
  transformation,
  structureTransformation,
}: Props) => {
  const { transformationStructureStep } = useParams();

  const formKind =
    structureTransformation.type === StructureTransformationType.CONTRACTION
      ? FormKind.CONTRACTION
      : FormKind.EXTENSION;

  if (transformationStructureStep === StructureTransformationStep.DESCRIPTION) {
    return (
      <ExistingStructureIdentificationForm
        transformation={transformation}
        structureTransformation={structureTransformation}
        formKind={formKind}
      />
    );
  }

  return null;
};
