import { useFormContext } from "react-hook-form";

import { DeleteButton } from "@/app/components/common/DeleteButton";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import UploadWithValidation from "@/app/components/forms/UploadWithValidation";
import { AdditionalFieldsType } from "@/app/utils/documentOperateur.util";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

export const DocumentOperateur = ({
  document,
  additionalFieldsType = AdditionalFieldsType.DATE,
  documentLabel,
  handleDeleteField,
  categoryShortName,
}: Props) => {
  const { control, watch } = useFormContext();

  const documentsOperateur: (
    | ActeAdministratifFormValues
    | DocumentFinancierFlexibleFormValues
  )[] = watch("documentsOperateur") || [];

  const index = documentsOperateur.findIndex(
    (documentOperateur) =>
      (documentOperateur.uuid && documentOperateur.uuid === document.uuid) ||
      (documentOperateur.id && documentOperateur.id === document.id)
  );

  if (index === -1) {
    return null;
  }

  const isActeAdministratif = (
    document: ActeAdministratifFormValues | DocumentFinancierFlexibleFormValues
  ): document is ActeAdministratifFormValues => {
    return "date" in document;
  };

  const getDocumentKey = (): string => {
    return isActeAdministratif(document)
      ? "actesAdministratifs"
      : "documentsFinanciers";
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-6 items-start">
        <InputWithValidation
          name={`${getDocumentKey()}.${index}.id`}
          control={control}
          label=""
          type="hidden"
        />
        <InputWithValidation
          name={`${getDocumentKey()}.${index}.category`}
          control={control}
          label=""
          type="hidden"
        />

        {additionalFieldsType === AdditionalFieldsType.DATE && (
          <div className="flex gap-6 items-start h-full">
            <InputWithValidation
              name={`${getDocumentKey()}.${index}.date`}
              defaultValue={
                isActeAdministratif(document)
                  ? document.date
                  : new Date(document.year, 0, 1).toDateString()
              }
              control={control}
              label={categoryShortName}
              className="w-full mb-0"
              type="date"
            />
          </div>
        )}
        {additionalFieldsType === AdditionalFieldsType.NAME && (
          <div className="flex gap-6 items-start h-full">
            <InputWithValidation
              name={`${getDocumentKey()}.${index}.name`}
              control={control}
              label="Nom du document"
              className="w-full mb-0"
              type="text"
              hintText="32 caractères maximum"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="mb-2">{documentLabel}</label>
          <UploadWithValidation
            name={`${getDocumentKey()}.${index}.fileUploads.0.key`}
            control={control}
          />
        </div>
        {index > 0 && (
          <DeleteButton
            onClick={() => handleDeleteField(index)}
            backgroundColor="grey"
            className="mt-8"
          />
        )}
      </div>
    </>
  );
};

type Props = {
  document: ActeAdministratifFormValues | DocumentFinancierFlexibleFormValues;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
  categoryShortName: string;
  handleDeleteField: (index: number, shouldConfirm?: boolean) => void;
};
