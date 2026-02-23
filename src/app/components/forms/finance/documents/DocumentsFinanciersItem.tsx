import Button from "@codegouvfr/react-dsfr/Button";
import prettyBytes from "pretty-bytes";
import { ReactElement, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { FileUploadWithLink, useFileUpload } from "@/app/hooks/useFileUpload";
import { getShortDisplayedName } from "@/app/utils/file-upload.util";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

import { granularities } from "./documentsStructures";

export const DocumentsFinanciersItem = ({
  documentFinancier,
}: Props): ReactElement => {
  const { watch, setValue } = useFormContext();

  const { getFile, deleteFile } = useFileUpload();

  const [fileData, setFileData] = useState<FileUploadWithLink | null>(null);
  useEffect(() => {
    const getFileData = async () => {
      if (documentFinancier.fileUploads?.[0]?.key) {
        const fileData = await getFile(documentFinancier.fileUploads?.[0]?.key);
        setFileData(fileData);
      }
    };

    getFileData();
  }, [documentFinancier, getFile]);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const confirm = window.confirm(
      "Attention, vous allez supprimer définitivement ce fichier. Êtes-vous bien sûr·e de vouloir continuer ?"
    );

    if (!confirm) {
      return;
    }

    try {
      if (documentFinancier.fileUploads?.[0]?.key) {
        await deleteFile(documentFinancier.fileUploads?.[0]?.key);
      }

      const documentsFinanciers = watch(
        "documentsFinanciers"
      ) as DocumentFinancierFlexibleFormValues[];

      const indexToRemove = documentsFinanciers.findIndex(
        (field) =>
          field.fileUploads?.[0]?.key ===
          documentFinancier.fileUploads?.[0]?.key
      );

      setValue(
        "documentsFinanciers",
        documentsFinanciers.filter((_, index) => index !== indexToRemove)
      );
    } catch {
      console.error("Erreur lors de la suppression du fichier");
    }
  };

  const handleView = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (fileData?.fileUrl) {
      window.open(fileData.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-mention-grey">
      <span className="fr-icon-file-text-fill text-title-blue-france fr-icon--sm" />
      <span className="text-default-grey">
        {
          granularities.find(
            (granularity) => granularity.value === documentFinancier.granularity
          )?.label
        }
      </span>
      {" - "}
      <span>
        {documentFinancier.name ||
          getShortDisplayedName(fileData?.originalName)}
      </span>
      <span>
        (
        {fileData?.fileSize
          ? prettyBytes(fileData?.fileSize, { locale: "fr" })
          : ""}
        )
      </span>
      <Button
        iconId="fr-icon-eye-line"
        priority="tertiary no outline"
        size="small"
        className="!rounded-full !bg-white"
        title="Télécharger le fichier"
        onClick={handleView}
      />
      <Button
        onClick={handleDelete}
        iconId="fr-icon-delete-bin-line"
        priority="tertiary no outline"
        size="small"
        title="Supprimer"
      />
    </div>
  );
};

type Props = {
  documentFinancier: DocumentFinancierFlexibleFormValues;
};
