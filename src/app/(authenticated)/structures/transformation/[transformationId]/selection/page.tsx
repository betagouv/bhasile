"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformations } from "@/app/hooks/useTransformations";
import {
  getTransformationFormNavigation,
  getTransformationSteps,
  getTransformationTitle,
} from "@/app/utils/transformation.util";
import { TRANSFORMATION_TYPE_SPECS } from "@/config/transformation.config";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import {
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { useTransformationContext } from "../_context/TransformationClientContext";
import {
  ReinitialiserSelectionModal,
  reinitialiserSelectionModal,
} from "./_components/ReinitialiserSelectionModal";
import { TransformationSelectionSummary } from "./_components/TransformationSelectionSummary";

export default function TransformationSelectionsPage() {
  const router = useRouter();

  const { transformation, setTransformation } = useTransformationContext();

  const { resetTransformationSelection } = useTransformations();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const [isEditing, setIsEditing] = useState(false);

  const [pendingSelection, setPendingSelection] = useState<{
    type: TransformationType;
    structureVersionTransformations: StructureVersionTransformationApiCreate[];
  } | null>(null);

  const formType = getFormByType(transformation.type);

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
    try {
      const freshTransformation = await resetTransformationSelection(
        transformation.id,
        pendingSelection,
        setTransformation
      );
      reinitialiserSelectionModal.close();
      const { firstStep } = getTransformationFormNavigation({
        transformationSteps: getTransformationSteps(freshTransformation),
        transformationId: freshTransformation.id,
      });
      router.push(firstStep.route);
    } catch (error) {
      console.error(error);
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

const getFormByType = (
  type?: TransformationType
): TransformationFormType | undefined => {
  switch (type) {
    case TransformationType.OUVERTURE_EX_NIHILO:
    case TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
      return TransformationFormType.CREATION;
    case TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES:
      return TransformationFormType.HUDA;
    case TransformationType.EXTENSION_EX_NIHILO:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES:
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    case TransformationType.FERMETURE_SANS_TRANSFERT:
    default:
      return undefined;
  }
};
