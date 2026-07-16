import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { useFetchStructure } from "@/app/hooks/useFetchStructure";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { CreationTransformationForm } from "./CreationTransformationForm";
import { FromStructureVersionTransformationForm } from "./FromStructureVersionTransformationForm";
import { HudaTransformationForm } from "./HudaTransformationForm";
import { StructureSelections } from "./StructureSelections";

export const TransformationTypeForms = ({
  formType,
  structureId,
  initialTransformationType,
  initialStructureVersionTransformations,
  onSubmit,
}: Props) => {
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const { structure: departureStructure } = useFetchStructure(structureId);

  const [transformationType, setTransformationType] = useState<
    TransformationType | undefined
  >(initialTransformationType);

  const [structureVersionTransformations, setStructureVersionTransformations] = useState<
    StructureVersionTransformationApiCreate[]
  >(initialStructureVersionTransformations ?? []);

  const [areSelectionsComplete, setAreSelectionsComplete] =
    useState<boolean>(false);

  const setSelectionsState = ({
    structureVersionTransformations,
    areSelectionsComplete,
  }: {
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
    areSelectionsComplete: boolean;
  }) => {
    setStructureVersionTransformations(structureVersionTransformations);
    setAreSelectionsComplete(areSelectionsComplete);
  };

  const handleSubmit = () => {
    if (transformationType) {
      onSubmit(transformationType, structureVersionTransformations);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-20 mb-10">
      <h1 className="mb-0 text-xl font-bold text-title-blue-france text-center">
        Quel est le cas de figure ?
      </h1>
      <div className="bg-white p-6 rounded-lg">
        {formType === TransformationFormType.HUDA && (
          <HudaTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {formType === TransformationFormType.CREATION && (
          <CreationTransformationForm
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        )}
        {structureId && !formType ? (
          <FromStructureVersionTransformationForm
            structure={departureStructure}
            transformationType={transformationType}
            setTransformationType={setTransformationType}
          />
        ) : null}
      </div>
      {transformationType ? (
        <StructureSelections
          transformationType={transformationType}
          structureId={structureId}
          departureType={departureStructure?.type}
          departureDepartement={departureStructure?.departementAdministratif}
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
    </div>
  );
};

type Props = {
  formType: TransformationFormType | undefined;
  structureId?: number;
  initialTransformationType?: TransformationType;
  initialStructureVersionTransformations?: StructureVersionTransformationApiCreate[];
  onSubmit: (
    transformationType: TransformationType,
    structureVersionTransformations: StructureVersionTransformationApiCreate[]
  ) => void;
};
