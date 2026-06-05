"use client";

import { useParams } from "next/navigation";

import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
} from "@/types/transformation.type";

import { ExistingStructureIdentificationForm } from "./ExistingStructureIdentificationForm";
import { TransformationActesAdministratifsForm } from "./TransformationActesAdministratifsForm";

type Props = {
  transformation: TransformationApiRead;
  structureVersionTransformation: StructureVersionTransformationApiRead;
};

export const ExistingStructureFlow = ({
  transformation,
  structureVersionTransformation,
}: Props) => {
  const { transformationStructureStep } = useParams();

  const formKind =
    structureVersionTransformation.type === StructureVersionTransformationType.CONTRACTION
      ? FormKind.CONTRACTION
      : FormKind.EXTENSION;

  if (transformationStructureStep === StructureVersionTransformationStep.DESCRIPTION) {
    return (
      <ExistingStructureIdentificationForm
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
