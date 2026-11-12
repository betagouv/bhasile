"use client";

import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { ReactElement, useRef, useState } from "react";
import { Control, useController } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { FaqFormValues } from "@/schemas/forms/base/faq.schema";

export const FaqCategoryField = ({
  control,
  categories,
}: Props): ReactElement => {
  const { field, fieldState } = useController({ control, name: "category" });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  const selectExistingCategory = (category: string): void => {
    setIsNewCategory(false);
    field.onChange(category);
  };

  const selectNewCategory = (): void => {
    setIsNewCategory(true);
    field.onChange(newCategory);
  };

  const editNewCategory = (value: string): void => {
    setNewCategory(value);
    setIsNewCategory(true);
    field.onChange(value);
  };

  return (
    <RadioButtons
      legend="Catégorie"
      hintText="Une catégorie correspond à un onglet de la FAQ"
      name="category"
      orientation="horizontal"
      options={[
        ...categories.map((category) => ({
          label: category,
          nativeInputProps: {
            value: category,
            checked: !isNewCategory && field.value === category,
            onChange: () => selectExistingCategory(category),
          },
        })),
        {
          label: (
            <span className="inline-block w-56 -my-1">
              <input
                ref={newCategoryInputRef}
                className={cn(
                  "fr-input py-1",
                  !isNewCategory && "text-disabled-grey"
                )}
                aria-label="Nouvelle catégorie"
                placeholder="Nouvelle catégorie"
                value={newCategory}
                onFocus={selectNewCategory}
                onChange={(event) => editNewCategory(event.target.value)}
              />
            </span>
          ),
          nativeInputProps: {
            value: "",
            "aria-label": "Nouvelle catégorie",
            checked: isNewCategory,
            onChange: () => {
              selectNewCategory();
              newCategoryInputRef.current?.focus();
            },
          },
        },
      ]}
      state={fieldState.error ? "error" : "default"}
      stateRelatedMessage={fieldState.error?.message}
    />
  );
};

type Props = {
  control: Control<FaqFormValues>;
  categories: string[];
};
