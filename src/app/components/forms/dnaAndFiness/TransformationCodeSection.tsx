import Button from "@codegouvfr/react-dsfr/Button";
import { ReactNode } from "react";
import { FieldValues, useFieldArray, useFormContext } from "react-hook-form";

import { CustomNotice } from "../../common/CustomNotice";
import { DeleteButton } from "../../common/DeleteButton";
import InputWithValidation from "../InputWithValidation";

export const TransformationCodeSection = ({
  title,
  noticeDescription,
  fieldArrayName,
  emptyItem,
  descriptionHint,
  addButtonLabel,
  getDescriptionFieldName,
  renderCodeInput,
}: Props) => {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({ control, name: fieldArrayName });

  const savedItems = watch(fieldArrayName) as unknown[] | undefined;
  const items = savedItems && savedItems.length > 0 ? savedItems : [emptyItem];
  const hasMultipleCodes = items.length > 1;

  const handleAdd = () => {
    if (savedItems && savedItems.length > 0) {
      append(emptyItem);
    } else {
      append([emptyItem, emptyItem]);
    }
  };

  const handleDelete = (indexToDelete: number) => {
    remove(indexToDelete);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold mb-0 text-title-blue-france max-w-3xl">
        {title}
      </h2>
      <CustomNotice severity="info" title="" description={noticeDescription} />
      {items.map((_, index) => (
        <div key={index} className="flex gap-6 items-start">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">{renderCodeInput(index)}</div>
            {hasMultipleCodes && (
              <div className="flex flex-col gap-1 md:col-span-2">
                <InputWithValidation
                  name={getDescriptionFieldName(index)}
                  id={getDescriptionFieldName(index)}
                  control={control}
                  type="text"
                  label="Description"
                  className="mb-0"
                />
                <span className="text-[#666666] text-sm">
                  {descriptionHint}
                </span>
              </div>
            )}
          </div>
          {hasMultipleCodes && (
            <div className="w-8 mt-9">
              {index >= 1 && (
                <DeleteButton
                  onClick={() => handleDelete(index)}
                  size="small"
                  backgroundColor="grey"
                />
              )}
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        iconId="fr-icon-add-line"
        priority="tertiary no outline"
        className="underline font-normal p-0"
        onClick={handleAdd}
      >
        {addButtonLabel}
      </Button>
    </div>
  );
};

type Props = {
  title: ReactNode;
  noticeDescription: ReactNode;
  fieldArrayName: string;
  emptyItem: FieldValues;
  descriptionHint: string;
  addButtonLabel: string;
  getDescriptionFieldName: (index: number) => string;
  renderCodeInput: (index: number) => ReactNode;
};
