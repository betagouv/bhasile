"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { TransformationType } from "@/types/transformation.type";

import { CreationTransformationForm } from "./_components/CreationTransformationForm";
import { FromStructureTransformationForm } from "./_components/FromStructureTransformationForm";
import { HudaTransformationForm } from "./_components/HudaTransformationForm";

export default function TransformationSelectionPage() {
  const searchParams = useSearchParams();
  const structureId = Number(searchParams.get("structureId"));
  const type = searchParams.get("type") as "creation" | "huda" | undefined;

  const [transformationType, setTransformationType] = useState<
    TransformationType | undefined
  >(undefined);

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto mt-20">
      <h1 className="text-xl font-bold text-title-blue-france text-center">
        Quel est le cas de figure ?
      </h1>
      <div className="bg-white p-6 rounded-lg">
        {type === "huda" && (
          <HudaTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {type === "creation" && (
          <CreationTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {structureId && !type ? (
          <FromStructureTransformationForm
            structureId={structureId}
            transformationType={transformationType}
            setTransformationType={(value) => {
              console.log(value);
              setTransformationType(value as TransformationType);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
