"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

export const autoSaveModal = createModal({
  id: "autosave-modal",
  isOpenedByDefault: false,
});
export const finalisationSuccessModal = createModal({
  id: "finalisation-success-modal",
  isOpenedByDefault: false,
});
export const actualisationSuccessModal = createModal({
  id: "actualisation-success-modal",
  isOpenedByDefault: false,
});

export const StructureHeaderModals = ({
  structureId,
}: {
  structureId: number;
}): ReactElement => {
  const router = useRouter();
  const backToStructure = () => router.push(`/structures/${structureId}`);

  return (
    <>
      <autoSaveModal.Component
        title="Votre progression est enregistrée automatiquement"
        buttons={[
          { doClosesModal: true, children: "J’ai compris", type: "button" },
        ]}
      >
        <p>
          Aucune action n’est requise de votre part pour enregistrer les données
          que vous avez saisies.
        </p>
      </autoSaveModal.Component>

      <finalisationSuccessModal.Component
        title="Vous avez terminé la création de cette structure !"
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
            onClick: backToStructure,
          },
        ]}
      >
        <p>
          Les données ont bien été enregistrées. Merci pour votre contribution
          qui va rendre l’outil plus précis.
        </p>
      </finalisationSuccessModal.Component>

      <actualisationSuccessModal.Component
        title="L’actualisation de cette structure est validée !"
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
            onClick: backToStructure,
          },
        ]}
      >
        <p>
          Les données ont bien été enregistrées. Merci pour votre contribution
          qui va rendre l’outil plus précis.
        </p>
      </actualisationSuccessModal.Component>
    </>
  );
};
