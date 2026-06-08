"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";

export const enregistrementModal = createModal({
  id: "enregistrement-avancee-transformation-modal",
  isOpenedByDefault: false,
});

export const EnregistrementModal = ({ onQuit }: Props) => (
  <enregistrementModal.Component
    title="Votre avancée a été enregistrée."
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
    Vous retrouverez cette démarche dans l&apos;onglet « à finaliser ».
  </enregistrementModal.Component>
);

type Props = {
  onQuit: () => void;
};
