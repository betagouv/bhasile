"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { FetchState } from "@/types/fetch-state.type";

export const annulerDemarcheModal = createModal({
  id: "annuler-demarche-transformation-modal",
  isOpenedByDefault: false,
});

interface AnnulerDemarcheModalProps {
  deleteState: FetchState | undefined;
  onDelete: () => Promise<void>;
}

export const AnnulerDemarcheModal = ({
  deleteState,
  onDelete,
}: AnnulerDemarcheModalProps) => (
  <annulerDemarcheModal.Component
    title="Attention, vous êtes sur le point d'annuler cette démarche."
    buttons={[
      {
        doClosesModal: true,
        children: "Revenir au formulaire",
        type: "button",
      },
      {
        doClosesModal: false,
        children: "Annuler et quitter",
        type: "button",
        disabled: deleteState === FetchState.LOADING,
        onClick: onDelete,
      },
    ]}
    className="[&_h1]:text-left! [&_p]:text-left!"
  >
    <>
      <p>
        Les données saisies ne seront pas conservées et les changements ne
        seront pas effectifs, voulez-vous continuer ?
      </p>
      {deleteState === FetchState.ERROR && (
        <Alert
          severity="error"
          small
          description="Une erreur est survenue lors de l'annulation. Veuillez réessayer."
        />
      )}
    </>
  </annulerDemarcheModal.Component>
);
