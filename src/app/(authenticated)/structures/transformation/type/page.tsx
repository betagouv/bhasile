"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformations } from "@/app/hooks/useTransformations";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import { TransformationType } from "@/types/transformation.type";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as "creation" | "huda" | undefined;

  const router = useRouter();

  const { createTransformation } = useTransformations();

  const { setFetchState } = useFetchState();

  const handleSubmit = async (
    transformationType: TransformationType,
    structureTransformations: StructureTransformationApiCreate[]
  ) => {
    setFetchState("transformation-save", FetchState.LOADING);
    try {
      const transformationId = await createTransformation({
        type: transformationType,
        structureTransformations,
      });
      if (transformationId) {
        router.push(`/structures/transformation/${transformationId}`);
      }
    } catch (error) {
      console.error(error);
      setFetchState("transformation-save", FetchState.ERROR);
    }
  };

  return (
    <TransformationTypeForms
      formType={type}
      structureId={structureId}
      onSubmit={handleSubmit}
    />
  );
}
