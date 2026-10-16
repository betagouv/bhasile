"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import {
  ChangeEvent,
  ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { DeleteButton } from "@/app/components/common/DeleteButton";
import Loader from "@/app/components/ui/Loader";
import { FileUploadResponse, useFileUpload } from "@/app/hooks/useFileUpload";
import { cn } from "@/app/utils/classname.util";
import { formatBytes } from "@/app/utils/number.util";
import {
  confirmFileDeletion,
  FILE_DELETION_ERROR_MESSAGE,
} from "@/utils/file-deletion.util";

export const FileUploadBox = ({
  value,
  onUpload,
  onDelete,
  ariaLabelledBy,
  accessibleLabel,
  errorMessage,
  accept = DEFAULT_ACCEPT,
  className,
}: Props): ReactElement => {
  const { uploadFile, deleteFile, getDownloadLink } = useFileUpload();
  const statusId = useId();

  const [status, setStatus] = useState<Status>("idle");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");

  const focusTargetRef = useRef<FocusTarget>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const browseButtonRef = useRef<HTMLButtonElement>(null);
  const fileNameButtonRef = useRef<HTMLButtonElement>(null);

  const fileKey = value?.key;
  const displayedErrorMessage = uploadErrorMessage || errorMessage;

  useEffect(() => {
    const targetButton =
      focusTargetRef.current === "file"
        ? fileNameButtonRef.current
        : browseButtonRef.current;
    if (focusTargetRef.current && targetButton) {
      targetButton.focus();
      focusTargetRef.current = null;
    }
  }, [fileKey, status, uploadErrorMessage]);

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setStatus("loading");
    setUploadErrorMessage("");
    try {
      const fileUpload = await uploadFile(file);
      focusTargetRef.current = "file";
      setStatus("idle");
      onUpload(fileUpload);
    } catch (error) {
      focusTargetRef.current = "browse";
      setStatus("idle");
      setUploadErrorMessage(
        error instanceof Error ? error.message : DEFAULT_UPLOAD_ERROR
      );
    }
  };

  const handleView = async () => {
    if (!fileKey) {
      return;
    }
    try {
      const link = await getDownloadLink(fileKey);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Erreur lors de la récupération du fichier", error);
    }
  };

  const handleDelete = async () => {
    if (!fileKey) {
      return;
    }
    if (!confirmFileDeletion()) {
      return;
    }
    setStatus("deleting");
    try {
      await deleteFile(fileKey);
      focusTargetRef.current = "browse";
      setStatus("idle");
      setUploadErrorMessage("");
      onDelete();
    } catch {
      setStatus("idle");
      setUploadErrorMessage(FILE_DELETION_ERROR_MESSAGE);
    }
  };

  const fileName = value?.originalName || value?.key;

  return (
    <div
      role="group"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "grid items-center justify-center bg-alt-blue-france py-4 px-8 rounded min-h-16",
        displayedErrorMessage &&
          "border-plain-error border-l-2! border-0 rounded-l-none",
        className
      )}
      data-form-error={displayedErrorMessage ? true : undefined}
    >
      {fileKey && status !== "deleting" ? (
        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 w-full">
          <i
            className="fr-icon-file-text-fill text-action-high-blue-france"
            aria-hidden="true"
          />
          <span className="truncate block w-full max-w-full">
            <button
              ref={fileNameButtonRef}
              type="button"
              onClick={handleView}
              className="truncate block max-w-full text-left"
            >
              {fileName}
            </button>
            <span className="text-xs text-default-grey tabular-nums">
              {formatBytes(value?.fileSize)}
            </span>
          </span>
          <Button
            type="button"
            iconId="fr-icon-eye-line"
            priority="tertiary no outline"
            size="small"
            className="rounded-full! bg-white!"
            title={`Voir ${fileName}`}
            onClick={handleView}
          />
          <DeleteButton
            onClick={handleDelete}
            size="small"
            backgroundColor="white"
            title={`Supprimer ${fileName}`}
          />
        </div>
      ) : (
        <span className="flex items-center justify-center gap-4">
          {status === "idle" && (
            <span className={cn(displayedErrorMessage && "fr-error-text mt-0")}>
              {displayedErrorMessage || "Pas de fichier"}
            </span>
          )}
          {status === "deleting" && <span>Suppression en cours…</span>}
          {status !== "deleting" && (
            <Button
              ref={browseButtonRef}
              type="button"
              size="small"
              priority="tertiary no outline"
              className="bg-white rounded"
              onClick={handleBrowse}
              disabled={status === "loading"}
              aria-describedby={statusId}
            >
              {status === "loading" ? <Loader /> : "Parcourir"}
              <span className="fr-sr-only"> – {accessibleLabel}</span>
            </Button>
          )}
        </span>
      )}
      <span id={statusId} className="fr-sr-only" aria-live="polite">
        {getStatusMessage(status, displayedErrorMessage, fileName)}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

const getStatusMessage = (
  status: Status,
  errorMessage: string | undefined,
  fileName: string | undefined
): string => {
  if (status === "loading") {
    return "Chargement du fichier…";
  }
  if (status === "deleting") {
    return "Suppression du fichier…";
  }
  if (errorMessage) {
    return errorMessage;
  }
  if (fileName) {
    return `Fichier ${fileName} importé`;
  }
  return "Pas de fichier";
};

const DEFAULT_ACCEPT = ".pdf,.xls,.xlsx,.xlsm,.csv,.ods";
const DEFAULT_UPLOAD_ERROR = "Erreur lors de l'upload du fichier";

type Status = "idle" | "loading" | "deleting";
type FocusTarget = "file" | "browse" | null;

type Props = {
  value?: Partial<FileUploadResponse> & { key: string };
  onUpload: (fileUpload: FileUploadResponse) => void;
  onDelete: () => void;
  ariaLabelledBy: string;
  accessibleLabel: string;
  errorMessage?: string;
  accept?: string;
  className?: string;
};
