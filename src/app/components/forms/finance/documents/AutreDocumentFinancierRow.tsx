import Input from "@codegouvfr/react-dsfr/Input";
import { ReactElement, useId, useState } from "react";

import { DeleteButton } from "@/app/components/common/DeleteButton";
import { FileUploadBox } from "@/app/components/forms/FileUploadBox";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { hasDocumentFile } from "@/app/utils/document-financier.util";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import {
  confirmFileDeletion,
  FILE_DELETION_ERROR_MESSAGE,
} from "@/utils/file-deletion.util";

export const AutreDocumentFinancierRow = ({
  documentFinancier,
  year,
  canRemove,
  isSubmitted,
  onChange,
  onRemove,
}: Props): ReactElement => {
  const documentLabelId = useId();
  const { deleteFile } = useFileUpload();
  const [removeErrorMessage, setRemoveErrorMessage] = useState("");
  const [draftName, setDraftName] = useState(documentFinancier.name ?? "");

  const fileUpload = hasDocumentFile(documentFinancier)
    ? documentFinancier.fileUploads?.[0]
    : undefined;
  const name = documentFinancier.name ?? "";
  const hasMissingFileError = isSubmitted && !!name.trim() && !fileUpload;

  const commitName = () => {
    if (draftName !== name) {
      onChange({ name: draftName });
    }
  };

  const handleRemove = async () => {
    if (fileUpload?.key) {
      if (!confirmFileDeletion()) {
        return;
      }
      try {
        await deleteFile(fileUpload.key);
      } catch {
        setRemoveErrorMessage(FILE_DELETION_ERROR_MESSAGE);
        return;
      }
    }
    onRemove();
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2.5rem] gap-x-8 items-end">
        <Input
          label="Nom du document"
          hintText="32 caractères maximum"
          className="mb-0"
          nativeInputProps={{
            value: draftName,
            maxLength: 32,
            onChange: (event) => setDraftName(event.target.value),
            onBlur: commitName,
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                commitName();
              }
            },
          }}
        />
        <div>
          <p id={documentLabelId} className="mb-2">
            Document
          </p>
          <FileUploadBox
            value={fileUpload}
            onUpload={(uploadedFile) =>
              onChange({ name: draftName, fileUploads: [uploadedFile] })
            }
            onDelete={() => onChange({ fileUploads: [] })}
            ariaLabelledBy={documentLabelId}
            accessibleLabel={`Autre document ${year}${name ? ` ${name}` : ""}`}
            errorMessage={
              hasMissingFileError
                ? "Importez le document ou supprimez la ligne"
                : undefined
            }
          />
        </div>
        {canRemove && (
          <DeleteButton
            onClick={handleRemove}
            size="small"
            backgroundColor="grey"
            title={`Supprimer la ligne${name ? ` ${name}` : ""}`}
            className="mb-5"
          />
        )}
      </div>
      {removeErrorMessage && (
        <p className="fr-error-text" role="alert">
          {removeErrorMessage}
        </p>
      )}
    </div>
  );
};

type Props = {
  documentFinancier: DocumentFinancierFlexibleFormValues;
  year: number;
  canRemove: boolean;
  isSubmitted: boolean;
  onChange: (changes: Partial<DocumentFinancierFlexibleFormValues>) => void;
  onRemove: () => void;
};
