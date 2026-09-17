import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";
import { useFormContext } from "react-hook-form";

import { DeleteButton } from "@/app/components/common/DeleteButton";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { getShortDisplayedName } from "@/app/utils/file-upload.util";
import { formatBytes } from "@/app/utils/number.util";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

export const DocumentsFinanciersItem = ({
  documentFinancier,
}: Props): ReactElement => {
  const { watch, setValue } = useFormContext();

  const { getDownloadLink, deleteFile } = useFileUpload();

  const fileUpload = documentFinancier.fileUploads?.[0];

  const handleDelete = async () => {
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
    if (!fileUpload?.key) {
      return;
    }

    try {
      const link = await getDownloadLink(fileUpload.key);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      console.error("Erreur lors de la récupération du fichier");
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-mention-grey">
      <span className="fr-icon-file-text-fill text-title-blue-france fr-icon--sm" />
      <span>
        {documentFinancier.name ||
          getShortDisplayedName(fileUpload?.originalName)}
      </span>
      <span>({formatBytes(fileUpload?.fileSize)})</span>
      <Button
        iconId="fr-icon-eye-line"
        priority="tertiary no outline"
        size="small"
        className="!rounded-full !bg-white"
        title="Télécharger le fichier"
        onClick={handleView}
      />
      <DeleteButton
        onClick={handleDelete}
        backgroundColor="grey"
        size="small"
      />
    </div>
  );
};

type Props = {
  documentFinancier: DocumentFinancierFlexibleFormValues;
};
