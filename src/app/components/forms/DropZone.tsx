import { Button } from "@codegouvfr/react-dsfr/Button";
import prettyBytes from "pretty-bytes";
import { useRef, useState } from "react";

import { FileUploadWithLink, useFileUpload } from "@/app/hooks/useFileUpload";
import { cn } from "@/app/utils/classname.util";
import { getShortDisplayedName } from "@/app/utils/file-upload.util";

import Loader from "../ui/Loader";

export const DropZone = ({ className, onChange, children }: Props) => {
  const { uploadFile, getFile, deleteFile } = useFileUpload();

  const [currentState, setCurrentState] = useState<State>("idle");
  const [currentErrorMessage, setCurrentErrorMessage] = useState<string>("");
  const [fileData, setFileData] = useState<FileUploadWithLink | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) {
      setCurrentState("error");
      setCurrentErrorMessage("Veuillez sélectionner un fichier");
      return;
    }

    const file = files[0];
    setCurrentState("loading");

    try {
      const result = await uploadFile(file);
      const fileData = await getFile(result.key);

      setKey(result.key);
      setFileData(fileData);
      setCurrentState("success");
      setCurrentErrorMessage("");

      onChange?.({ key: result.key });
    } catch {
      setCurrentState("error");
      setCurrentErrorMessage("Erreur lors de l'upload du fichier");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentState("loading");
    try {
      if (key) {
        await deleteFile(key);
        setKey(null);
        setFileData(null);
        setCurrentErrorMessage("");
        setCurrentState("idle");
        onChange?.({ key: undefined });
      }
    } catch {
      setCurrentState("error");
      setCurrentErrorMessage("Erreur lors de la suppression du fichier");
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleDrop(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleDrop(files);
    }
  };

  if (currentState === "success" && key) {
    return (
      <div className={cn(wrapperClassName, className)}>
        <div className="flex gap-2 items-center mb-6">
          <span className="fr-icon-file-text-fill text-title-blue-france" />
          <p className="mb-0">
            <span>{getShortDisplayedName(fileData?.originalName)}</span>
            <span className="text-disabled-grey text-xs block">
              {fileData?.fileSize
                ? prettyBytes(fileData?.fileSize, { locale: "fr" })
                : ""}
            </span>
          </p>

          <Button
            iconId="fr-icon-delete-bin-line"
            priority="tertiary no outline"
            size="small"
            className="!rounded-full !bg-white"
            title="Supprimer le fichier"
            onClick={handleDelete}
          />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
      onClick={handleClick}
      className={cn(
        wrapperClassName,
        "border-dashed",
        isDragging && "border-2",
        className
      )}
      style={{ cursor: "pointer" }}
    >
      <div className="flex flex-col items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept=".pdf,.xls,.xlsx,.xlsm,.csv,.ods"
        />
        <span className="fr-icon-file-add-fill [&::before]:[--icon-size:2.5rem] text-title-blue-france mb-3" />
        {currentState === "loading" ? (
          <Loader />
        ) : (
          <p className="text-center mb-0">
            <strong>Glisser déposer</strong> ou
            <br />
            <span className="text-title-blue-france underline">
              cliquer pour ajouter un fichier
            </span>
          </p>
        )}
        <span className="text-center text-disabled-grey text-sm">
          PDF, XLS, XLSX, XLSM, CSV et ODS seulement - Taille maximale : 10 Mo
        </span>
        {currentErrorMessage && (
          <span className="text-center text-default-error text-sm">
            {currentErrorMessage}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

const wrapperClassName =
  "flex flex-col justify-center items-center w-full h-full bg-alt-blue-france p-4 rounded border border-action-high-blue-france";

type Props = {
  className?: string;
  onChange: (data: { key?: string }) => void;
  children: React.ReactNode;
};

type State = "idle" | "loading" | "success" | "error";
