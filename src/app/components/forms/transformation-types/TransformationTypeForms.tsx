import { Button } from "@codegouvfr/react-dsfr/Button";
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
  onSubmit,
}: Props) => {
  const [transformationType, setTransformationType] = useState<
    TransformationType | undefined
  >(initialTransformationType);

  const setSelectionsState = ({
    structureTransformations,
    areSelectionsComplete,
  }: {
    structureTransformations: StructureTransformationApiType[];
    areSelectionsComplete: boolean;
  }) => {
    setStructureTransformations(structureTransformations);
    setAreSelectionsComplete(areSelectionsComplete);
  };

  const [structureTransformations, setStructureTransformations] = useState<
    StructureTransformationApiType[]
  >(initialStructureTransformations ?? []);
  const [areSelectionsComplete, setAreSelectionsComplete] =
    useState<boolean>(false);

  const handleSubmit = () => {
    if (transformationType) {
      onSubmit(transformationType, structureTransformations);
    }
  };

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
            transformationStructureId={structureId}
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        ) : null}
      </div>
      {transformationType ? (
        <StructureSelections
          transformationType={transformationType}
          structureId={structureId}
          onChange={setSelectionsState}
        />
      ) : null}
      <div className="flex justify-center">
        <Button
          disabled={!areSelectionsComplete || !transformationType}
          onClick={handleSubmit}
        >
          Je valider
        </Button>
      </div>
    </div>
  );
};

type Props = {
  formType: "creation" | "huda" | undefined;
  structureId?: number;
  initialTransformationType?: TransformationType;
  initialStructureTransformations?: StructureTransformationApiType[];
  onSubmit: (
    transformationType: TransformationType,
    structureTransformations: StructureTransformationApiType[]
  ) => void;
};
