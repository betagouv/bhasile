"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { useFaqItemMutations } from "@/hooks/useFaqItemMutations";
import { useModalTarget } from "@/hooks/useModalTarget";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqFormValues } from "@/schemas/forms/base/faq.schema";
import { groupFaqItemsByCategory } from "@/utils/faq.util";

import {
  FaqCategoryRenameModal,
  faqCategoryRenameModal,
} from "./FaqCategoryRenameModal";
import { FaqDeleteModal, faqDeleteModal } from "./FaqDeleteModal";
import { FaqItemModal, faqItemModal } from "./FaqItemModal";

export const FaqManager = ({ faqItems }: Props): ReactElement => {
  const { saveFaqItem, deleteFaqItem, renameFaqCategory, isSaving } =
    useFaqItemMutations();
  const itemModal = useModalTarget<FaqApiType>(faqItemModal);
  const deleteModal = useModalTarget<FaqApiType>(faqDeleteModal);
  const renameModal = useModalTarget<string>(faqCategoryRenameModal);

  const categoryGroups = groupFaqItemsByCategory(faqItems);

  const submitFaqItem = async (values: FaqFormValues): Promise<boolean> =>
    (await saveFaqItem(itemModal.target?.id ?? null, values)) !== null;

  const confirmDelete = async (id: number): Promise<boolean> =>
    (await deleteFaqItem(id)) !== null;

  const submitCategoryRename = async (
    category: string,
    newCategory: string
  ): Promise<boolean> =>
    (await renameFaqCategory({ category, newCategory })) !== null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button iconId="fr-icon-add-line" onClick={() => itemModal.open(null)}>
          Ajouter une question
        </Button>
      </div>

      {categoryGroups.length === 0 && (
        <p className="text-mention-grey">La FAQ ne contient aucune question.</p>
      )}

      {categoryGroups.map(({ category, items }) => (
        <section key={category}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="fr-h6 text-title-blue-france mb-0">{category}</h3>
            <Button
              priority="tertiary no outline"
              size="small"
              iconId="fr-icon-edit-line"
              onClick={() => renameModal.open(category)}
            >
              Renommer
            </Button>
          </div>
          <ul className="list-none p-0 m-0 bg-white border border-default-grey rounded-[10px]">
            {items.map((faqItem) => (
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
                    onClick={() => itemModal.open(faqItem)}
                  >
                    Modifier
                  </Button>
                  <Button
                    priority="tertiary no outline"
                    size="small"
                    iconId="fr-icon-delete-line"
                    onClick={() => deleteModal.open(faqItem)}
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
        faqItem={itemModal.target}
        openCount={itemModal.openCount}
        categories={categoryGroups.map(({ category }) => category)}
        isSaving={isSaving}
        onSubmit={submitFaqItem}
      />
      <FaqDeleteModal
        faqItem={deleteModal.target}
        isSaving={isSaving}
        onConfirm={confirmDelete}
      />
      <FaqCategoryRenameModal
        category={renameModal.target}
        openCount={renameModal.openCount}
        isSaving={isSaving}
        onSubmit={submitCategoryRename}
      />
    </div>
  );
};

type Props = {
  faqItems: FaqApiType[];
};
