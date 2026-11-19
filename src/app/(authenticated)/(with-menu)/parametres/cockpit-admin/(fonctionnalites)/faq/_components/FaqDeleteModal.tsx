"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement } from "react";

import { FaqApiType } from "@/schemas/api/faq.schema";

export const FaqDeleteModal = ({
  faqItem,
  isSaving,
  onConfirm,
}: Props): ReactElement => {
  const confirm = async (): Promise<void> => {
    if (faqItem && (await onConfirm(faqItem.id))) {
      faqDeleteModal.close();
    }
  };

  return (
    <faqDeleteModal.Component
      title="Supprimer la question"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Supprimer",
          type: "button",
          disabled: isSaving,
          onClick: confirm,
        },
      ]}
    >
      <p className="mb-2">
        La question sera retirée de la FAQ pour tous les utilisateurs.
      </p>
      {faqItem && <p className="font-bold mb-0">{faqItem.question}</p>}
    </faqDeleteModal.Component>
  );
};

export const faqDeleteModal = createModal({
  id: "faq-delete-modal",
  isOpenedByDefault: false,
});

type Props = {
  faqItem: FaqApiType | null;
  isSaving: boolean;
  onConfirm: (id: number) => Promise<boolean>;
};
