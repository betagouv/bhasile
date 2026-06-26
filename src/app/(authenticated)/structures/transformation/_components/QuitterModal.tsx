"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

import { SubmitError } from "@/app/components/SubmitError";
import { FetchState } from "@/types/fetch-state.type";

export const quitterModal = createModal({
  id: "quitter-transformation-modal",
  isOpenedByDefault: false,
});

export const QuitterModal = ({ saveState, onQuit, onSaveAndQuit }: Props) => (
  <quitterModal.Component
    title="Vous êtes sur le point de quitter un formulaire en cours de modification."
    buttons={[
      {
        doClosesModal: true,
        children: "Annuler",
        type: "button",
        priority: "secondary",
      },
      {
        doClosesModal: false,
        children: "Quitter",
        type: "button",
        priority: "primary",
        onClick: onQuit,
      },
      {
        doClosesModal: false,
        children: "Enregistrer et quitter",
        type: "button",
        disabled: saveState === FetchState.LOADING,
        onClick: onSaveAndQuit,
      },
    ]}
    className="[&_h1]:text-left! [&_p]:text-left!"
  >
    <>
      <p>
        Voulez-vous enregistrer votre avancée ? Vous retrouverez toutes les
        structures en cours de création ou de transformation enregistrées dans
        l’onglet « à finaliser ».
      </p>
      {saveState === FetchState.ERROR && (
        <SubmitError backendError="Une erreur est survenue lors de l'enregistrement. Veuillez réessayer." />
      )}
    </>
  </quitterModal.Component>
);

type Props = {
  saveState: FetchState | undefined;
  onQuit: () => void;
  onSaveAndQuit: () => Promise<void>;
};
