"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import autoAnimate from "@formkit/auto-animate";
import prettyBytes from "pretty-bytes";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import Loader from "@/app/components/ui/Loader";
import { FileUploadResponse, useFileUpload } from "@/app/hooks/useFileUpload";
import { cn } from "@/app/utils/classname.util";

const Upload = ({
  className,
  id,
  value,
  accept,
  onChange,
  state,
  errorMessage,
  ...props
}: UploadProps) => {
  const { register, setValue } = useFormContext();
  const { uploadFile, getFile, deleteFile } = useFileUpload();

  const [currentState, setCurrentState] = useState<UploadState>(
    state || "idle"
  );
  const [currentErrorMessage, setCurrentErrorMessage] = useState<string>(
    errorMessage || ""
  );
  const [file, setFile] = useState<FileDataType | undefined>(undefined);
  const [valueState, setValueState] = useState<string>("");

  useEffect(() => {
    const initialValue = value;

    if (initialValue) {
      async function syncFileData() {
        setCurrentState("loading");
        try {
          const fileData = await getFile(initialValue as string);
          setFile(fileData as FileDataType);
          setCurrentState("success");
        } catch {
          setCurrentState("error");
          setCurrentErrorMessage("Erreur lors de la récupération du fichier");
        }
      }
      syncFileData();

      setValueState(String(initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentState(state || "idle");
    setCurrentErrorMessage(errorMessage || "");
  }, [state, errorMessage]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputContainerRef = useRef(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<null | undefined> => {
    setCurrentState("loading");
    if (!event.target.files?.[0]) {
      setCurrentState("error");
      setCurrentErrorMessage("Veuillez sélectionner un fichier");
      return;
    }
    const file = event.target.files[0];
    try {
      const result = await uploadFile(file);
      const fileData = await getFile(result.key);

      const stringKey = String(result.key);
      setValueState(stringKey);
      setFile(fileData);
      setCurrentState("success");
      setCurrentErrorMessage("");

      const idFieldName = props.name?.replace(".key", ".id");

      if (idFieldName && fileData?.id) {
        setValue(idFieldName, fileData.id);
      }

      onChange?.({
        target: { value: stringKey },
      } as React.ChangeEvent<HTMLInputElement>);

      return;
    } catch {
      setCurrentState("error");
      setCurrentErrorMessage("Erreur lors de l'upload du fichier");
      return;
    }
  };

  useEffect(() => {
    if (fileInputContainerRef.current) {
      autoAnimate(fileInputContainerRef.current);
    }
    if (buttonRef.current) {
      autoAnimate(buttonRef.current);
    }
  }, [fileInputContainerRef, buttonRef]);

  const handleBrowse = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    const confirm = window.confirm(
      "Attention, vous allez supprimer définitivement ce fichier. Êtes-vous bien sûr·e de vouloir continuer ?"
    );

    if (!confirm) {
      return;
    }

    setCurrentState("deleting");

    try {
      if (valueState) {
        await deleteFile(valueState);
      }

      setCurrentState("idle");
      setFile(undefined);
      setValueState("");
      setCurrentErrorMessage("");

      const idFieldName = props.name?.replace(".key", ".id");
      if (idFieldName) {
        setValue(idFieldName, "");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onChange?.({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    } catch {
      setCurrentState("error");
      setCurrentErrorMessage("Erreur lors de la suppression du fichier");
    }
  };

  return (
    <>
      <div
        className={cn(
          "grid items-center justify-center bg-alt-blue-france p-4 rounded min-h-[4rem] h-full w-md",
          state === "error" &&
            "border-plain-error !border-l-2  border-0 rounded-l-none",
          className
        )}
        ref={fileInputContainerRef}
      >
        {currentState === "idle" || currentState === "loading" ? (
          <span className="upload-idle flex items-center justify-center gap-2">
            <i className="fr-icon-close-circle-fill text-disabled-grey" />
            {currentState === "idle" ? "Pas de fichier" : "Chargement..."}

            <Button
              size="small"
              priority="tertiary no outline"
              className="bg-white"
              onClick={handleBrowse}
              disabled={currentState === "loading"}
              ref={buttonRef}
            >
              {currentState === "idle" ? "Parcourir" : <Loader />}
            </Button>
          </span>
        ) : null}
        {currentState === "success" ? (
          <div className="upload-success grid grid-cols-[auto_1fr_auto_auto] items-center justify-center gap-2 w-full">
            <i className="fr-icon-file-text-fill text-action-high-blue-france" />
            <span className="truncate block w-full max-w-full">
              <a
                href={file?.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate block max-w-full"
              >
                <Tooltip kind="hover" title={file?.originalName}>
                  {file?.originalName}
                </Tooltip>
              </a>
              {file?.fileSize && (
                <span className="text-xs text-default-grey tabular-nums">
                  {prettyBytes(file?.fileSize, { locale: "fr" })}
                </span>
              )}
            </span>
            <Button
              iconId="fr-icon-eye-line"
              priority="tertiary no outline"
              size="small"
              className="!rounded-full !bg-white"
              title="Télécharger le fichier"
              onClick={() =>
                window.open(file?.fileUrl, "_blank", "noopener,noreferrer")
              }
            />
            <Button
              iconId="fr-icon-delete-bin-line"
              priority="tertiary no outline"
              size="small"
              className="!rounded-full !bg-white"
              title="Supprimer le fichier"
              onClick={handleDelete}
            />
          </div>
        ) : null}
        {currentState === "error" ? (
          <div className="upload-error flex items-center justify-center gap-2">
            <span className="fr-error-text mt-0">{currentErrorMessage}</span>
            <Button
              size="small"
              priority="tertiary no outline"
              className="bg-white"
              onClick={handleBrowse}
              ref={buttonRef}
            >
              Parcourir
            </Button>
          </div>
        ) : null}
        {currentState === "deleting" ? (
          <div className="upload-deleting flex items-center justify-center gap-2">
            Suppression en cours...
          </div>
        ) : null}
        <input
          className="hidden"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
        />

        <input
          type="hidden"
          value={file?.id || ""}
          {...register(`${props.name?.replace(".key", ".id")}`)}
          readOnly
        />
        <input
          type="text"
          className="h-0 p-0 opacity-0 absolute"
          aria-hidden="true"
          onChange={(e) => {
            onChange?.(e);
            setValueState(e.target.value);
          }}
          name={props.name}
          id={id}
          value={valueState}
          {...props}
        />
      </div>
    </>
  );
};

export default Upload;

type UploadState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "uploaded"
  | "deleting";

type UploadProps = Omit<InputHTMLAttributes<HTMLInputElement>, "multiple"> & {
  fileData?: FileDataType;
  errorMessage?: string;
  state?: UploadState;
  id?: string;
};

type FileDataType = FileUploadResponse & {
  fileUrl: string;
};
