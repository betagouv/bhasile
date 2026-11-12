"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

import { useFaqItems } from "@/hooks/useFaqItems";
import { FaqApiType, FaqApiWrite } from "@/schemas/api/faq.schema";

import { FaqDeleteModal, faqDeleteModal } from "./FaqDeleteModal";
import { FaqItemModal, faqItemModal } from "./FaqItemModal";

export const FaqManager = ({ faqItems }: Props): ReactElement => {
  const { saveFaqItem, deleteFaqItem, isSaving } = useFaqItems();
  const [editedFaqItem, setEditedFaqItem] = useState<FaqApiType | null>(null);
  const [deletedFaqItem, setDeletedFaqItem] = useState<FaqApiType | null>(null);
  const [itemModalOpenCount, setItemModalOpenCount] = useState(0);

  const categories = [
    ...new Set(faqItems.map((faqItem) => faqItem.category)),
  ].sort((a, b) => a.localeCompare(b));

  const openItemModal = (faqItem: FaqApiType | null): void => {
    setEditedFaqItem(faqItem);
    setItemModalOpenCount((count) => count + 1);
    faqItemModal.open();
  };

  const openDeleteModal = (faqItem: FaqApiType): void => {
    setDeletedFaqItem(faqItem);
    faqDeleteModal.open();
  };

  const submitFaqItem = async (values: FaqApiWrite): Promise<boolean> =>
    (await saveFaqItem(editedFaqItem?.id ?? null, values)) !== null;

  const confirmDelete = async (id: number): Promise<boolean> =>
    (await deleteFaqItem(id)) !== null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button iconId="fr-icon-add-line" onClick={() => openItemModal(null)}>
          Ajouter une question
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-mention-grey">La FAQ ne contient aucune question.</p>
      )}

      {categories.map((category) => (
        <section key={category}>
          <h3 className="fr-h6 text-title-blue-france mb-3">{category}</h3>
          <ul className="list-none p-0 m-0 bg-white border border-default-grey rounded-[10px]">
            {faqItems
              .filter((faqItem) => faqItem.category === category)
              .map((faqItem) => (
                <li
                  key={faqItem.id}
                  className="flex items-center justify-between gap-4 px-6 py-3 border-b border-default-grey last:border-b-0"
                >
                  <span>{faqItem.question}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-edit-line"
                      onClick={() => openItemModal(faqItem)}
                    >
                      Modifier
                    </Button>
                    <Button
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-delete-line"
                      onClick={() => openDeleteModal(faqItem)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <FaqItemModal
        faqItem={editedFaqItem}
        openCount={itemModalOpenCount}
        categories={categories}
        isSaving={isSaving}
        onSubmit={submitFaqItem}
      />
      <FaqDeleteModal
        faqItem={deletedFaqItem}
        isSaving={isSaving}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

type Props = {
  faqItems: FaqApiType[];
};
