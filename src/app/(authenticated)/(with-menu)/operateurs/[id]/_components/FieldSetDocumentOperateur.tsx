import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { AdditionalFieldsType } from "@/app/utils/documentOperateur.util";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { DocumentOperateurCategory } from "@/types/operateur.type";

import { DocumentOperateur } from "./DocumentOperateur";

export default function FieldSetDocumentOperateur({
  category,
  categoryShortName,
  title,
  noTitleLegend = false,
  notice,
  isOptional,
  canAddFile,
  addFileButtonLabel,
  additionalFieldsType,
  documentLabel,
}: Props) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "documentsOperateur",
  });

  const documentsOperateur: (
    | ActeAdministratifFormValues
    | DocumentFinancierFlexibleFormValues
  )[] = watch("documentsOperateur") || [];

  const documentsOfCategory = documentsOperateur.filter(
    (document) => document?.category === category
  );

  const handleAddNewField = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    append({
      uuid: uuidv4(),
      category: category,
    });
  };

  const handleDeleteField = (index: number, shouldConfirm = true) => {
    if (shouldConfirm) {
      const confirm = window.confirm(
        "Attention, vous allez supprimer définitivement ce document opérateur. Êtes-vous bien sûr·e de vouloir continuer ?"
      );
      if (!confirm) {
        return;
      }
    }

    const indicesToRemove = [index];

    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach((index) => {
      remove(index);
    });
  };

  return (
    <fieldset className="flex flex-col gap-6 w-full">
      {!noTitleLegend && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          {title} {isOptional && "(optionnel)"}
        </legend>
      )}
      {notice && (
        <CustomNotice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center w-fit"
          description={<>{notice}</>}
        />
      )}
      {documentsOfCategory &&
        documentsOfCategory.length > 0 &&
        documentsOfCategory.map((document) => (
          <div key={document.id || document.uuid} className="mb-4">
            <DocumentOperateur
              categoryShortName={categoryShortName}
              document={document}
              additionalFieldsType={additionalFieldsType}
              documentLabel={documentLabel}
              handleDeleteField={handleDeleteField}
            />
          </div>
        ))}
      {canAddFile && (
        <Button
          onClick={handleAddNewField}
          priority="tertiary no outline"
          className="underline font-normal p-0"
        >
          + {addFileButtonLabel ?? "Ajouter un fichier"}
        </Button>
      )}
    </fieldset>
  );
}

type Props = {
  category: DocumentOperateurCategory;
  categoryShortName: string;
  title: string;
  noTitleLegend?: boolean;
  notice?: string | ReactElement;
  isOptional?: boolean;
  canAddFile?: boolean;
  addFileButtonLabel?: string;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
};
