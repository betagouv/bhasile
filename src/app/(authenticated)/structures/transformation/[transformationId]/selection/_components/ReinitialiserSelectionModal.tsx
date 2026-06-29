"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { FetchState } from "@/types/fetch-state.type";

export const reinitialiserSelectionModal = createModal({
  id: "reinitialiser-selection-transformation-modal",
  isOpenedByDefault: false,
});

export const ReinitialiserSelectionModal = ({ saveState, onConfirm }: Props) => (
  <reinitialiserSelectionModal.Component
    title="Attention, modifier le cas de figure réinitialise la démarche."
    buttons={[
      {
        doClosesModal: true,
        children: "Annuler",
        type: "button",
      },
      {
        doClosesModal: false,
        children: "Je valide",
        type: "button",
        disabled: saveState === FetchState.LOADING,
        onClick: onConfirm,
      },
    ]}
    className="[&_h1]:text-left! [&_p]:text-left!"
  >
    <>
      <p>
        Les données saisies dans les étapes suivantes seront définitivement
        perdues. Voulez-vous continuer ?
      </p>
      {saveState === FetchState.ERROR && (
        <Alert
          severity="error"
          small
          description="Une erreur est survenue lors de la réinitialisation. Veuillez réessayer."
        />
      )}
    </>
  </reinitialiserSelectionModal.Component>
);

type Props = {
  saveState: FetchState | undefined;
  onConfirm: () => Promise<void>;
};
