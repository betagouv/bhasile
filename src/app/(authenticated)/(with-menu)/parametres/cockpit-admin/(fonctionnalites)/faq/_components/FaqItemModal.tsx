"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactElement, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FaqApiType } from "@/schemas/api/faq.schema";
import { faqFormSchema, FaqFormValues } from "@/schemas/forms/base/faq.schema";
import { renderFaqMarkdown } from "@/utils/faq.util";

import { FaqCategoryField } from "./FaqCategoryField";

export const FaqItemModal = ({
  faqItem,
  openCount,
  categories,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: EMPTY_FAQ_ITEM,
  });
  useEffect(() => {
    reset(faqItem ?? EMPTY_FAQ_ITEM);
  }, [faqItem, openCount, reset]);

  const contentMarkdown = useWatch({ control, name: "contentMarkdown" });

  const submit = handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      faqItemModal.close();
    }
  });

  return (
    <faqItemModal.Component
      title={faqItem ? "Modifier la question" : "Ajouter une question"}
      size="large"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Enregistrer",
          type: "button",
          disabled: isSaving,
          onClick: submit,
        },
      ]}
    >
      <FaqCategoryField
        key={openCount}
        control={control}
        categories={categories}
      />
      <Input
        label="Question"
        nativeInputProps={register("question")}
        state={errors.question ? "error" : "default"}
        stateRelatedMessage={errors.question?.message}
      />
      <Input
        label="Réponse"
        hintText="Mise en forme Markdown : **gras**, listes avec -, liens [texte](https://…)"
        textArea
        nativeTextAreaProps={{ ...register("contentMarkdown"), rows: 8 }}
        state={errors.contentMarkdown ? "error" : "default"}
        stateRelatedMessage={errors.contentMarkdown?.message}
      />
      {contentMarkdown?.trim() && (
        <div className="border border-default-grey rounded p-4">
          <p className="text-sm text-mention-grey mb-2">Aperçu</p>
          <div
            dangerouslySetInnerHTML={{
              __html: renderFaqMarkdown(contentMarkdown),
            }}
          />
        </div>
      )}
    </faqItemModal.Component>
  );
};

export const faqItemModal = createModal({
  id: "faq-item-modal",
  isOpenedByDefault: false,
});

const EMPTY_FAQ_ITEM: FaqFormValues = {
  question: "",
  category: "",
  contentMarkdown: "",
};

type Props = {
  faqItem: FaqApiType | null;
  openCount: number;
  categories: string[];
  isSaving: boolean;
  onSubmit: (values: FaqFormValues) => Promise<boolean>;
};
