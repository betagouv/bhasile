"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useEffect, useMemo } from "react";

const adressesRecoveryModal = createModal({
  id: "adresses-recovery-modal",
  isOpenedByDefault: true,
});
export const AdressesRecoveryModal = ({
  adressesRecoveredNumber,
}: {
  adressesRecoveredNumber: number;
}) => {
  const title = useMemo(() => {
    if (adressesRecoveredNumber) {
      if (adressesRecoveredNumber === 1) {
        return `${adressesRecoveredNumber} adresse a été récupérée`;
      }
      return `${adressesRecoveredNumber} adresses ont été récupérées`;
    }
    return "Aucune adresse n'a été récupérée";
  }, [adressesRecoveredNumber]);

  // We need this because the modal does not always reopen when we navigate back to the page
  useEffect(() => {
    const timeout = setTimeout(() => {
      adressesRecoveryModal.open();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <adressesRecoveryModal.Component
      title={title}
      buttons={[
        {
          doClosesModal: true,
          children: "J’ai compris",
          type: "button",
        },
      ]}
    >
      {adressesRecoveredNumber ? (
        <p>
          Vous n’avez plus qu’à valider le formulaire pour finaliser
          l’enregistrement.
        </p>
      ) : (
        <p>
          Assurez-vous d’utiliser le même poste et le même navigateur que lors
          de la création de la structure.
          <br />
          <br />
          Si ce n’est pas possible, ou si le cache a été vidé, le formulaire
          devra être rempli via les méthodes classiques.
        </p>
      )}
    </adressesRecoveryModal.Component>
  );
};
