import { useState } from "react";

import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

import { CreationTransformationForm } from "./CreationTransformationForm";
import { FromStructureTransformationForm } from "./FromStructureTransformationForm";
import { HudaTransformationForm } from "./HudaTransformationForm";
import { StructureSelections } from "./StructureSelections";

export const TransformationTypeForms = ({
  formType,
  structureId,
  initialTransformationType,
  initialStructureTransformations,
}: Props) => {
  const [transformationType, setTransformationType] = useState<
    TransformationType | undefined
  >(initialTransformationType);

  const [structureTransformations, setStructureTransformations] = useState<
    StructureTransformationApiType[]
  >(initialStructureTransformations ?? []);

  console.log(structureTransformations);
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-20">
      <h1 className="mb-0 text-xl font-bold text-title-blue-france text-center">
        Quel est le cas de figure ?
      </h1>
      <div className="bg-white p-6 rounded-lg">
        {formType === "huda" && (
          <HudaTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {formType === "creation" && (
          <CreationTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {structureId && !formType ? (
          <FromStructureTransformationForm
            structureId={structureId}
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        ) : null}
      </div>
      {transformationType ? (
        <StructureSelections
          transformationType={transformationType}
          structureId={structureId}
          onChange={setStructureTransformations}
        />
      ) : null}
    </div>
  );
};

type Props = {
  formType: "creation" | "huda" | undefined;
  structureId?: number;
  initialTransformationType?: TransformationType;
  initialStructureTransformations?: StructureTransformationApiType[];
};
