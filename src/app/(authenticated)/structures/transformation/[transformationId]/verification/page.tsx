"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformationFormNavigation } from "@/app/hooks/useTransformationFormNavigation";
import { useTransformations } from "@/app/hooks/useTransformations";
import {
  getTransformationOriginRoute,
  sortStructureVersionTransformationsByType,
} from "@/app/utils/transformation.util";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { useTransformationContext } from "../_context/TransformationClientContext";
import { StructureVersionTransformationGroup } from "./_components/StructureVersionTransformationGroup";

const confirmationModal = createModal({
  id: "confirmation-transformation-modal",
  isOpenedByDefault: false,
});

export default function TransformationVerificationPage() {
  const router = useRouter();

  const {
    transformation,
    setTransformation,
    shouldShowIncompleteSteps,
    setShouldShowIncompleteSteps,
  } = useTransformationContext();
  const { updateTransformation } = useTransformations();
  const { prevStep } = useTransformationFormNavigation();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");

  const groups = groupStructureVersionTransformationsByType(
    transformation.structureVersionTransformations
  );

  const allChildFormsAreValidated =
    transformation.structureVersionTransformations.every(
      (structureVersionTransformation) =>
        structureVersionTransformation.form?.status === true
    );

  useIsModalOpen(confirmationModal, {
    onConceal: () => router.push(getTransformationOriginRoute(transformation)),
  });

  const handleSubmit = async () => {
    if (!allChildFormsAreValidated) {
      setShouldShowIncompleteSteps(true);
      return;
    }
    if (!transformation.form) {
      return;
    }
    try {
      await updateTransformation(
        transformation.id,
        {
          id: transformation.id,
          form: { ...transformation.form, status: true },
        },
        setTransformation
      );
      confirmationModal.open();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-6 mb-10 px-6">
      {prevStep && (
        <Link
          href={prevStep.route}
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line self-start"
        >
          Retour
        </Link>
      )}
      <h2 className="text-xl font-bold text-title-blue-france text-center mb-0">
        Confirmez-vous les informations suivantes&nbsp;?
      </h2>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <StructureVersionTransformationGroup
            key={group.type}
            type={group.type}
            structureVersionTransformations={group.items}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button
          disabled={saveState === FetchState.LOADING}
          onClick={handleSubmit}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Je confirme et certifie les informations
        </Button>
        {shouldShowIncompleteSteps && !allChildFormsAreValidated && (
          <p className="text-default-error m-0 flex items-center gap-1">
            <i
              className="fr-icon-error-fill text-default-error shrink-0"
              aria-hidden="true"
            />
            <span>
              Certaines étapes ne sont pas encore complétées.
              <br />
              Veuillez compléter les étapes signalées avant de confirmer.
            </span>
          </p>
        )}
      </div>
      {saveState === FetchState.ERROR && <SubmitError />}

      <confirmationModal.Component
        title={
          <span className="flex items-center gap-2">
            <span className="fr-icon-checkbox-circle-line" aria-hidden="true" />
            Les données ont été prises en compte.
          </span>
        }
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
          },
        ]}
      >
        Vous pouvez dès maintenant consulter les changements sur les pages des
        structures concernées.
        {transformation.type ===
          TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES &&
          " Aussi, si la ou les structures issues de la remise en concurrence des places ont déjà été définies, vous pouvez les déclarer en cliquant sur « Créer une structure » dans l’onglet structure."}
      </confirmationModal.Component>
    </div>
  );
}

type Group = {
  type: StructureVersionTransformationType;
  items: StructureVersionTransformationApiRead[];
};

const groupStructureVersionTransformationsByType = (
  structureVersionTransformations: StructureVersionTransformationApiRead[]
): Group[] => {
  const sortedStructureVersionTransformations =
    sortStructureVersionTransformationsByType(structureVersionTransformations);
  return sortedStructureVersionTransformations.reduce<Group[]>(
    (accumulator, structureVersionTransformation) => {
      const lastGroup = accumulator[accumulator.length - 1];
      if (lastGroup && lastGroup.type === structureVersionTransformation.type) {
        lastGroup.items.push(structureVersionTransformation);
        return accumulator;
      }
      accumulator.push({
        type: structureVersionTransformation.type,
        items: [structureVersionTransformation],
      });
      return accumulator;
    },
    []
  );
};
