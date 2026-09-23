"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { useTransformations } from "@/app/hooks/useTransformations";
import {
  getTransformationFormNavigation,
  getTransformationSteps,
  getTransformationTitle,
} from "@/app/utils/transformation.util";
import { TRANSFORMATION_TYPE_SPECS } from "@/config/transformation.config";
import { useFetchState } from "@/contexts/FetchStateContext";
import { useTransformationContext } from "@/contexts/TransformationContext";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

import {
  ReinitialiserSelectionModal,
  reinitialiserSelectionModal,
} from "./_components/ReinitialiserSelectionModal";
import { TransformationSelectionSummary } from "./_components/TransformationSelectionSummary";

export default function TransformationSelectionsPage() {
  const router = useRouter();

  const { transformation } = useTransformationContext();

  const { resetTransformationSelection } = useTransformations();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");
  const { mutate: resetSelection } = useSaveMutation(
    "transformation-save",
    (input: {
      type: TransformationType;
      structureVersionTransformations: StructureVersionTransformationApiCreate[];
    }) => resetTransformationSelection(transformation.id, input)
  );

  const [isEditing, setIsEditing] = useState(false);

  const [pendingSelection, setPendingSelection] = useState<{
    type: TransformationType;
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
  } | null>(null);

  const formType = transformation.type
    ? TRANSFORMATION_TYPE_SPECS[transformation.type].formType
    : undefined;

  const primaryStructureVersionTransformationType = transformation.type
    ? TRANSFORMATION_TYPE_SPECS[transformation.type]
        .primaryStructureVersionTransformationType
    : undefined;
  const primaryStructureVersionTransformation =
    primaryStructureVersionTransformationType &&
    transformation.structureVersionTransformations?.find(
      (structureVersionTransformation) =>
        structureVersionTransformation.type ===
        primaryStructureVersionTransformationType
    );
  const sourceStructureId = primaryStructureVersionTransformation
    ? primaryStructureVersionTransformation.structureVersion?.structureId
    : undefined;

  const handleSubmit = (
    transformationType: TransformationType,
    structureVersionTransformations: StructureVersionTransformationApiCreate[]
  ) => {
    setPendingSelection({
      type: transformationType,
      structureVersionTransformations,
    });
    reinitialiserSelectionModal.open();
  };

  const handleConfirmReset = async () => {
    if (!pendingSelection) {
      return;
    }
    const freshTransformation = await resetSelection(pendingSelection);
    if (freshTransformation !== null) {
      reinitialiserSelectionModal.close();
      const { firstStep } = getTransformationFormNavigation({
        transformationSteps: getTransformationSteps(freshTransformation),
        transformationId: freshTransformation.id,
      });
      router.push(firstStep.route);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-20 mb-10">
        <h1 className="mb-0 text-xl font-bold text-title-blue-france text-center">
          {getTransformationTitle(transformation.type)}
        </h1>
        <TransformationSelectionSummary
          structureVersionTransformations={
            transformation.structureVersionTransformations
          }
        />
        <div className="flex justify-center">
          <Button
            priority="secondary"
            iconId="fr-icon-edit-line"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
          >
            Modifier le cas de figure
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TransformationTypeForms
        formType={formType}
        structureId={sourceStructureId}
        onSubmit={handleSubmit}
      />
      <div className="flex justify-center mb-10">
        <Button priority="secondary" onClick={() => setIsEditing(false)}>
          Annuler
        </Button>
      </div>
      <ReinitialiserSelectionModal
        saveState={saveState}
        onConfirm={handleConfirmReset}
      />
    </>
  );
}
