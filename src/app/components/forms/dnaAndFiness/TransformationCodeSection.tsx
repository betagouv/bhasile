import Button from "@codegouvfr/react-dsfr/Button";
import { ReactNode } from "react";
import { FieldValues, useFormContext } from "react-hook-form";

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
  isEmptyItem,
}: Props) => {
  const { control, watch, setValue } = useFormContext();

  const savedItems = watch(fieldArrayName) as FieldValues[] | undefined;
  const items = savedItems && savedItems.length > 0 ? savedItems : [emptyItem];
  const hasMultipleCodes = items.length > 1;

  const handleAdd = () => {
    if (savedItems && savedItems.length > 0) {
      setValue(fieldArrayName, [...savedItems, emptyItem]);
    } else {
      setValue(fieldArrayName, [emptyItem, emptyItem]);
    }
  };

  const handleDelete = (indexToDelete: number) => {
    if (items.length > 1) {
      setValue(
        fieldArrayName,
        items.filter((_, itemIndex) => itemIndex !== indexToDelete)
      );
      return;
    }
    setValue(fieldArrayName, [emptyItem]);
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold mb-0 text-title-blue-france max-w-3xl">
        {title}
      </h2>
      <CustomNotice severity="info" description={noticeDescription} />
      {items.map((item, index) => (
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
          <div className="w-8 mt-9">
            {(items.length > 1 || !isEmptyItem(item)) && (
              <DeleteButton
                onClick={() => handleDelete(index)}
                size="small"
                backgroundColor="grey"
              />
            )}
          </div>
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
  isEmptyItem: (item: FieldValues) => boolean;
};
