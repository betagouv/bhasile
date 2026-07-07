"use client";

import { notFound, useParams } from "next/navigation";

import { useTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { TransformationStructureHeader } from "@/app/components/transformations/TransformationStructureHeader";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import { CreationFlow } from "./_components/creation/CreationFlow";
import { FermetureFlow } from "./_components/fermeture/FermetureFlow";
import { ExistingStructureFlow } from "./_components/shared/ExistingStructureFlow";

export default function TransformationStructureStepPage() {
  const { transformationStructureId } = useParams();
  const { transformation } = useTransformationContext();

  const structureVersionTransformation = transformation?.structureVersionTransformations.find(
    (structureVersionTransformation) =>
      structureVersionTransformation.id === Number(transformationStructureId)
  );

  if (!transformation || !structureVersionTransformation) {
    notFound();
  }

  return (
    <>
      <TransformationStructureHeader
        structureVersionTransformation={structureVersionTransformation}
      />
      {renderFlow(structureVersionTransformation, transformation)}
    </>
  );
}

const renderFlow = (
  structureVersionTransformation: StructureVersionTransformationApiRead,
  transformation: TransformationApiRead
) => {
  switch (structureVersionTransformation.type) {
    case StructureVersionTransformationType.FERMETURE:
      return (
        <FermetureFlow
          transformation={transformation}
          structureVersionTransformation={structureVersionTransformation}
        />
      );
    case StructureVersionTransformationType.EXTENSION:
    case StructureVersionTransformationType.CONTRACTION:
      return (
        <ExistingStructureFlow
          transformation={transformation}
          structureVersionTransformation={structureVersionTransformation}
        />
      );
    case StructureVersionTransformationType.CREATION:
      return (
        <CreationFlow
          transformation={transformation}
          structureVersionTransformation={structureVersionTransformation}
        />
      );
    default:
      notFound();
  }
};
