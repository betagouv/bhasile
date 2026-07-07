"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { TransformationHeader } from "@/app/(authenticated)/structures/transformation/_components/TransformationHeader";
import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { useTransformations } from "@/app/hooks/useTransformations";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
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
  const { mutate: saveTransformation } = useSaveMutation(
    "transformation-save",
    createTransformation
  );

  const handleSubmit = async (
    transformationType: TransformationType,
    structureVersionTransformations: StructureVersionTransformationApiCreate[]
  ) => {
    const transformationId = await saveTransformation({
      type: transformationType,
      structureVersionTransformations,
    });
    if (transformationId !== null) {
      router.push(`/structures/transformation/${transformationId}`);
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
