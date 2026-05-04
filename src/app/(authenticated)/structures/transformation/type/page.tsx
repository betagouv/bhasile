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
    <div>
      <h1>Quel est le cas de figure ?</h1>
      <div>
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
            setTransformationType={setTransformationType}
          />
        ) : null}
      </div>
    </div>
  );
}
