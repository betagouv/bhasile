import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import { TransformationType } from "@/types/transformation.type";

import { SubmitError } from "../../SubmitError";
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
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const [transformationType, setTransformationType] = useState<
    TransformationType | undefined
  >(initialTransformationType);

  const [structureTransformations, setStructureTransformations] = useState<
    StructureTransformationApiCreate[]
  >(initialStructureTransformations ?? []);

  const [areSelectionsComplete, setAreSelectionsComplete] =
    useState<boolean>(false);

  const setSelectionsState = ({
    structureTransformations,
    areSelectionsComplete,
  }: {
    structureTransformations: StructureTransformationApiCreate[];
    areSelectionsComplete: boolean;
  }) => {
    setStructureTransformations(structureTransformations);
    setAreSelectionsComplete(areSelectionsComplete);
  };

  const handleSubmit = () => {
    if (transformationType) {
      onSubmit(transformationType, structureTransformations);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-20 mb-10">
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
          disabled={
            !areSelectionsComplete ||
            !transformationType ||
            saveState === FetchState.LOADING
          }
          onClick={handleSubmit}
        >
          Je valide
        </Button>
      </div>
      {saveState === FetchState.ERROR && <SubmitError />}
    </div>
  );
};

type Props = {
  formType: "creation" | "huda" | undefined;
  structureId?: number;
  initialTransformationType?: TransformationType;
  initialStructureTransformations?: StructureTransformationApiCreate[];
  onSubmit: (
    transformationType: TransformationType,
    structureTransformations: StructureTransformationApiCreate[]
  ) => void;
};
