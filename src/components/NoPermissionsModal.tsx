"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement } from "react";

const noPermissionsModal = createModal({
  id: "no-permissions-modal",
  isOpenedByDefault: false,
});

export const openNoPermissionsModal = (): void => noPermissionsModal.open();

export const NoPermissionsModal = (): ReactElement => (
  <noPermissionsModal.Component
    title="Vous n'avez pas les droits pour finaliser cette structure."
    buttons={[
      {
        doClosesModal: true,
        children: "J'ai compris",
        type: "button",
      },
    ]}
  >
    <p>
      Toutes les informations concernant cette structure n’ont pas encore été
      saisies. Veuillez attendre qu’une personne disposant des droits
      nécessaires finalise sa création afin de pouvoir consulter cette page.
    </p>
  </noPermissionsModal.Component>
);
