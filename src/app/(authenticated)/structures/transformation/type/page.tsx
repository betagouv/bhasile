"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { TransformationHeader } from "@/app/(authenticated)/structures/transformation/_components/TransformationHeader";
import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useTransformations } from "@/app/hooks/useTransformations";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as TransformationFormType | undefined;

  const router = useRouter();

  const { createTransformation } = useTransformations();

  const handleSubmit = async (
    transformationType: TransformationType,
    structureTransformations: StructureTransformationApiCreate[]
  ) => {
    try {
      const transformationId = await createTransformation({
        type: transformationType,
        structureTransformations,
      });
      router.push(`/structures/transformation/${transformationId}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <TransformationHeader />
      <TransformationTypeForms
        formType={type}
        structureId={structureId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
