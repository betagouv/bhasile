"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { TransformationHeader } from "@/app/(authenticated)/structures/transformation/_components/TransformationHeader";
import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformations } from "@/app/hooks/useTransformations";
import { ApiError } from "@/app/utils/apiError.util";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { TransformationMenu } from "../_components/TransformationMenu";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as TransformationFormType | undefined;

  const router = useRouter();

  const { createTransformation } = useTransformations();
  const { setFetchState } = useFetchState();

  const handleSubmit = async (
    transformationType: TransformationType,
    structureVersionTransformations: StructureVersionTransformationApiCreate[]
  ) => {
    setFetchState("transformation-save", FetchState.LOADING);
    try {
      const transformationId = await createTransformation({
        type: transformationType,
        structureVersionTransformations,
      });
      setFetchState("transformation-save", FetchState.IDLE);
      router.push(`/structures/transformation/${transformationId}`);
    } catch (error) {
      setFetchState(
        "transformation-save",
        FetchState.ERROR,
        error instanceof ApiError ? error.message : undefined
      );
    }
  };

  return (
    <main className="w-full max-w-screen flex" id="content">
      <TransformationMenu />
      <div className="flex-1 bg-alt-grey">
        <TransformationHeader />
        <TransformationTypeForms
          formType={type}
          structureId={structureId}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
