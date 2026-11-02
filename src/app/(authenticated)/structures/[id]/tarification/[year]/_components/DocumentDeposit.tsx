"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Select from "@codegouvfr/react-dsfr/Select";
import { ChangeEvent, ReactElement, useRef, useState } from "react";

import { getApiErrorMessage } from "@/app/utils/api-error.util";
import { ALLOWED_MIME_TYPES } from "@/constants";
import {
  TarificationDocumentStatus,
  type TarificationDocumentType,
} from "@/generated/prisma/enums";
import type { DepositOption } from "@/lib/tarification/tarification.actions";

export const DocumentDeposit = ({
  options,
  onDeposit,
}: Props): ReactElement => {
  const [type, setType] = useState(options[0].type);
  const [isSigned, setIsSigned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { statuses } = options.find((option) => option.type === type)!;
  const canChooseSignature = statuses.length > 1;
  const signedStatus = isSigned
    ? TarificationDocumentStatus.FINAL
    : TarificationDocumentStatus.DRAFT;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setIsUploading(true);
    setErrorMessage(null);
    try {
      await onDeposit({
        file,
        type,
        status: canChooseSignature ? signedStatus : statuses[0],
      });
      setIsSigned(false);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Le dépôt n’a pas abouti. Réessayez dans quelques instants."
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {options.length > 1 && (
        <Select
          label="Type de document"
          className="mb-0"
          nativeSelectProps={{
            value: type,
            onChange: (event) =>
              setType(event.target.value as TarificationDocumentType),
          }}
        >
          {options.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
      {canChooseSignature && (
        <Checkbox
          small
          className="mb-0"
          options={[
            {
              label: "C’est la version signée",
              nativeInputProps: {
                checked: isSigned,
                onChange: (event) => setIsSigned(event.target.checked),
              },
            },
          ]}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Fichier à déposer"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        iconId="fr-icon-upload-line"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "Dépôt en cours…" : "Déposer un document"}
      </Button>
      {errorMessage && (
        <p role="alert" className="mb-0 text-sm text-default-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

type Props = {
  options: DepositOption[];
  onDeposit: (document: {
    file: File;
    type: TarificationDocumentType;
    status: TarificationDocumentStatus;
  }) => Promise<void>;
};
