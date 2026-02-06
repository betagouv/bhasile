import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { AdditionalFieldsType } from "@/types/categoryToDisplay.type";
import { ActeAdministratifCategoryType } from "@/types/file-upload.type";

import { UploadsByCategoryFile } from "./UploadsByCategoryFile";

export type ActeAdministratifField = ActeAdministratifFormValues & {
  id: string;
  uuid: string;
};

export default function UploadsByCategory({
  category,
  categoryShortName,
  title,
  noTitleLegend = false,
  notice,
  isOptional,
  canAddFile,
  canAddAvenant = false,
  avenantCanExtendDateEnd = false,
  addFileButtonLabel,
  additionalFieldsType,
  documentLabel,
}: UploadsByCategoryProps) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  const actesAdministratifs: ActeAdministratifField[] =
    watch("actesAdministratifs") || [];

  let filteredFields: ActeAdministratifField[] = [];

  const refreshFields = () => {
    filteredFields = actesAdministratifs.filter(
      (field: ActeAdministratifField) => {
        return (
          field.category &&
          (field.category as string) === category &&
          !field.parentFileUploadId
        );
      }
    );
  };

  refreshFields();

  const handleAddNewField = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const newField = {
      key: null,
      category: category,
      uuid: uuidv4(),
    };

    append(newField);

    refreshFields();
  };

  const handleDeleteField = (index: number) => {
    const parent = actesAdministratifs[index];

    const avenantIndices = actesAdministratifs
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => field.parentFileUploadId === parent?.id)
      .map(({ index }) => index);

    const indicesToRemove = [...avenantIndices, index];

    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach((index) => {
      remove(index);
    });

    refreshFields();
  };

  const getItemIndex = (uuid: string) => {
    const index = actesAdministratifs.findIndex(
      (acteAdministratif: ActeAdministratifField) =>
        acteAdministratif.uuid === uuid
    );
    return index;
  };

  return (
    <fieldset className="flex flex-col gap-6 w-full">
      {!noTitleLegend && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          {title} {isOptional && "(optionnel)"}
        </legend>
      )}
      {notice && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
          description={<>{notice}</>}
        />
      )}
      {filteredFields &&
        filteredFields.length > 0 &&
        filteredFields.map((field) => {
          const fieldIndex = getItemIndex(field.uuid);

          return (
            <div key={fieldIndex} className="mb-4">
              <UploadsByCategoryFile
                categoryShortName={categoryShortName}
                field={field}
                index={fieldIndex}
                key={field.key || null}
                additionalFieldsType={
                  additionalFieldsType || AdditionalFieldsType.DATE_START_END
                }
                documentLabel={documentLabel}
                handleDeleteField={handleDeleteField}
                canAddAvenant={canAddAvenant}
                avenantCanExtendDateEnd={avenantCanExtendDateEnd}
              />
            </div>
          );
        })}
      {canAddFile && (
        <Button
          onClick={handleAddNewField}
          priority="tertiary no outline"
          className="underline font-normal p-0"
        >
          + {addFileButtonLabel}
        </Button>
      )}
    </fieldset>
  );
}

type UploadsByCategoryProps = {
  category: ActeAdministratifCategoryType[number];
  categoryShortName: string;
  title: string;
  noTitleLegend?: boolean;
  notice?: string | React.ReactElement;
  isOptional?: boolean;
  canAddFile?: boolean;
  canAddAvenant?: boolean;
  avenantCanExtendDateEnd?: boolean;
  addFileButtonLabel?: string;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
};
