"use client";

import { notFound, useParams } from "next/navigation";

import { useTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { SubmitError } from "@/app/components/SubmitError";
import { TransformationStructureHeader } from "@/app/components/transformations/TransformationStructureHeader";
import { useFetchState } from "@/app/context/FetchStateContext";
import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import { StructureTransformationType } from "@/types/transformation.type";

import { CreationFlow } from "./_components/creation/CreationFlow";
import { FermetureFlow } from "./_components/fermeture/FermetureFlow";
import { ExistingStructureFlow } from "./_components/shared/ExistingStructureFlow";

export default function TransformationStructureStepPage() {
  const { transformationStructureId } = useParams();
  const { transformation } = useTransformationContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

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
      {renderFlow(structureTransformation, transformation)}
      {saveState === FetchState.ERROR && (
        <SubmitError
          codeBhasile={
            structureTransformation.structureVersion?.structure?.codeBhasile
          }
        />
      )}
    </>
  );
}

const renderFlow = (
  structureTransformation: StructureTransformationApiRead,
  transformation: TransformationApiRead
) => {
  switch (structureTransformation.type) {
    case StructureTransformationType.FERMETURE:
      return (
        <FermetureFlow
          transformation={transformation}
          structureTransformation={structureTransformation}
        />
      );
    case StructureTransformationType.EXTENSION:
    case StructureTransformationType.CONTRACTION:
      return (
        <ExistingStructureFlow
          transformation={transformation}
          structureTransformation={structureTransformation}
        />
      );
    case StructureTransformationType.CREATION:
      return (
        <CreationFlow
          transformation={transformation}
          structureTransformation={structureTransformation}
        />
      );
    default:
      notFound();
  }
};
