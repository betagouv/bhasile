"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useOptionalTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useTransformations } from "@/app/hooks/useTransformations";
import { getTransformationTitle } from "@/app/utils/transformation.util";
import { FetchState } from "@/types/fetch-state.type";
import { TransformationFormType } from "@/types/transformation.type";

import {
  AnnulerDemarcheModal,
  annulerDemarcheModal,
} from "./AnnulerDemarcheModal";
import {
  EnregistrementModal,
  enregistrementModal,
} from "./EnregistrementModal";
import { ErrorModal, errorModal } from "./ErrorModal";
import { QuitterModal, quitterModal } from "./QuitterModal";

export const TransformationHeader = () => {
  const { transformation, saveCurrentForm } =
    useOptionalTransformationContext();
  const { deleteTransformation } = useTransformations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("transformation-save");
  const deleteState = getFetchState("transformation-delete");

  const title = getTransformationTitle(
    transformation?.type ??
      (searchParams.get("type") as TransformationFormType | undefined)
  );

  const handleSaveProgress = async () => {
    if (!transformation) {
      return;
    }
    try {
      await saveCurrentForm();
      enregistrementModal.open();
    } catch (error) {
      console.error(error);
      errorModal.open();
    }
  };

  const handleSaveAndQuit = async () => {
    if (!transformation) {
      return;
    }
    try {
      await saveCurrentForm();
      router.push("/structures");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!transformation) {
      return;
    }
    try {
      await deleteTransformation(transformation.id);
      router.push("/structures");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-white border-b border-b-border-default-grey">
        <div className="flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/structures"
              className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
              title="Retour"
            >
              Retour
            </Link>
            <div>
              <p className="text-title-blue-france text-xs uppercase font-bold mb-0">
                Structure hébergement
              </p>
              <p className="text-title-blue-france font-bold fr-h6 mb-0">
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {transformation && (
              <>
                <Button
                  priority="tertiary no outline"
                  onClick={() => annulerDemarcheModal.open()}
                >
                  Annuler la démarche
                </Button>
                <Button
                  priority="secondary"
                  iconId="fr-icon-save-line"
                  iconPosition="left"
                  disabled={saveState === FetchState.LOADING}
                  onClick={handleSaveProgress}
                >
                  Enregistrer l&apos;avancée
                </Button>
              </>
            )}
            <Button
              priority="secondary"
              iconId="fr-icon-close-line"
              iconPosition="left"
              onClick={() => {
                if (transformation) {
                  quitterModal.open();
                } else {
                  router.push("/structures");
                }
              }}
            >
              Quitter
            </Button>
          </div>
        </div>
      </div>

      {transformation && (
        <>
          <AnnulerDemarcheModal
            deleteState={deleteState}
            onDelete={handleDelete}
          />
          <EnregistrementModal onQuit={() => router.push("/structures")} />
          <QuitterModal
            saveState={saveState}
            onQuit={() => router.push("/structures")}
            onSaveAndQuit={handleSaveAndQuit}
          />
          <ErrorModal onQuit={() => router.push("/structures")} />
        </>
      )}
    </>
  );
};
