"use client";

import { useSearchParams } from "next/navigation";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useTransformations } from "@/app/hooks/useTransformations";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as "creation" | "huda" | undefined;

  const { createTransformation } = useTransformations();

  const handleSubmit = (
    transformationType: TransformationType,
    structureTransformations: StructureTransformationApiCreate[]
  ) => {
    createTransformation({
      type: transformationType,
      structureTransformations,
    });
  };

  return (
    <TransformationTypeForms
      formType={type}
      structureId={structureId}
      onSubmit={handleSubmit}
    />
  );
}
