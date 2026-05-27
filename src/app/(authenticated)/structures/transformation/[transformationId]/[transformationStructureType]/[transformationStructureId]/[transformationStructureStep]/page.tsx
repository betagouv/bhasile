"use client";

import { notFound, useParams } from "next/navigation";

import { useTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { TransformationStructureHeader } from "@/app/components/transformations/TransformationStructureHeader";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { ContractionFlow } from "./_components/contraction/ContractionFlow";
import { CreationDepuisStructuresFlow } from "./_components/creation-depuis-structures/CreationDepuisStructuresFlow";
import { CreationExNihiloFlow } from "./_components/creation-ex-nihilo/CreationExNihiloFlow";
import { ExtensionFlow } from "./_components/extension/ExtensionFlow";
import { FermetureFlow } from "./_components/fermeture/FermetureFlow";

export default function TransformationStructureStepPage() {
  const { transformationStructureId } = useParams();
  const { transformation } = useTransformationContext();

  const structureTransformation = transformation?.structureTransformations.find(
    (structureTransformation) =>
      structureTransformation.id === Number(transformationStructureId)
  );

  if (!transformation || !structureTransformation) {
    notFound();
  }

  return (
    <>
      <TransformationStructureHeader
        structureTransformation={structureTransformation}
      />
      {renderFlow(structureTransformation, transformation.type)}
    </>
  );
}

const renderFlow = (
  structureTransformation: StructureTransformationApiRead,
  transformationType?: TransformationType
) => {
  switch (structureTransformation.type) {
    case StructureTransformationType.FERMETURE:
      return (
        <FermetureFlow structureTransformation={structureTransformation} />
      );
    case StructureTransformationType.EXTENSION:
      return (
        <ExtensionFlow structureTransformation={structureTransformation} />
      );
    case StructureTransformationType.CONTRACTION:
      return (
        <ContractionFlow structureTransformation={structureTransformation} />
      );
    case StructureTransformationType.CREATION:
      if (transformationType === TransformationType.OUVERTURE_EX_NIHILO) {
        return (
          <CreationExNihiloFlow
            structureTransformation={structureTransformation}
          />
        );
      }
      return (
        <CreationDepuisStructuresFlow
          structureTransformation={structureTransformation}
        />
      );
    default:
      notFound();
  }
};
