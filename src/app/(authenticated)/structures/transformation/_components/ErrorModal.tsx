"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

export const errorModal = createModal({
  id: "error-transformation-modal",
  isOpenedByDefault: false,
});

export const ErrorModal = ({ onQuit }: Props) => (
  <errorModal.Component
    title="Une erreur est survenue."
    buttons={[
      {
        doClosesModal: true,
        children: "Revenir au formulaire",
        type: "button",
      },
      {
        doClosesModal: false,
        children: "Quitter le formulaire",
        type: "button",
        onClick: onQuit,
      },
    ]}
    className="[&_h1]:text-left! [&_p]:text-left!"
  >
    L’enregistrement de la transformation a échoué. Veuillez réessayer.
  </errorModal.Component>
);

type Props = {
  onQuit: () => void;
};
