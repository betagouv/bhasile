"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactElement, useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  faqCategoryFormSchema,
  FaqCategoryFormValues,
} from "@/schemas/forms/base/faq.schema";

export const FaqCategoryRenameModal = ({
  category,
  openCount,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FaqCategoryFormValues>({
    resolver: zodResolver(faqCategoryFormSchema),
    defaultValues: { newCategory: "" },
  });

  useEffect(() => {
    reset({ newCategory: category ?? "" });
  }, [category, openCount, reset]);

  const submit = handleSubmit(async ({ newCategory }) => {
    if (category !== null && (await onSubmit(category, newCategory))) {
      faqCategoryRenameModal.close();
    }
  });

  return (
    <faqCategoryRenameModal.Component
      title="Renommer la catégorie"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Renommer",
          type: "button",
          disabled: isSaving,
          onClick: submit,
        },
      ]}
    >
      <Input
        label="Nom de la catégorie"
        hintText="Si ce nom est déjà celui d’une autre catégorie, les deux seront fusionnées"
        nativeInputProps={register("newCategory")}
        state={errors.newCategory ? "error" : "default"}
        stateRelatedMessage={errors.newCategory?.message}
      />
    </faqCategoryRenameModal.Component>
  );
};

export const faqCategoryRenameModal = createModal({
  id: "faq-category-rename-modal",
  isOpenedByDefault: false,
});

type Props = {
  category: string | null;
  openCount: number;
  isSaving: boolean;
  onSubmit: (category: string, newCategory: string) => Promise<boolean>;
};
