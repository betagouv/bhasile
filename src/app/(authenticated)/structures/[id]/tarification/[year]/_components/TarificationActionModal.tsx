"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement, useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "@/app/utils/api-error.util";
import { ALLOWED_MIME_TYPES } from "@/constants";

export const TarificationActionModal = ({
  modalId,
  request,
  onClose,
}: Props): ReactElement => {
  const modal = useMemo(
    () => createModal({ id: modalId, isOpenedByDefault: false }),
    [modalId]
  );
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedRequest, setDisplayedRequest] = useState(request);
  const [formVersion, setFormVersion] = useState(0);

  // Annuler ne passe par aucun gestionnaire : le motif d'une action ne doit pas se retrouver dans la suivante
  if (request !== displayedRequest) {
    setDisplayedRequest(request);
    setText("");
    setFile(null);
    setErrorMessage(null);
    setFormVersion(formVersion + 1);
  }

  useEffect(() => {
    if (request) {
      modal.open();
    }
  }, [request, modal]);

  const isTextMissing = !!request?.isTextRequired && text.trim().length === 0;

  const handleConfirm = async () => {
    if (!request || isTextMissing || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await request.onConfirm({ text: text.trim(), file });
      modal.close();
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "L’action n’a pas abouti. Réessayez dans quelques instants."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <modal.Component
      title={request?.title ?? ""}
      buttons={[
        { doClosesModal: true, priority: "secondary", children: "Annuler" },
        {
          doClosesModal: false,
          children: request?.confirmLabel ?? "Confirmer",
          disabled: isTextMissing || isSubmitting,
          onClick: handleConfirm,
        },
      ]}
    >
      <div key={formVersion} className="flex flex-col gap-3">
        <p className="mb-0">{request?.description}</p>
        {request?.warning && (
          <p className="mb-0 font-medium">{request.warning}</p>
        )}
        {request?.textLabel && (
          <Input
            textArea
            label={request.textLabel}
            nativeTextAreaProps={{
              value: text,
              onChange: (event) => setText(event.target.value),
            }}
          />
        )}
        {request?.canAttachFile && (
          <label className="flex flex-col gap-1 text-sm">
            Joindre une réponse (facultatif)
            <input
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {errorMessage && (
          <p role="alert" className="mb-0 text-sm text-default-error">
            {errorMessage}
          </p>
        )}
      </div>
    </modal.Component>
  );
};

export type ActionRequest = {
  title: string;
  description: string;
  warning?: string;
  textLabel?: string;
  isTextRequired?: boolean;
  canAttachFile?: boolean;
  confirmLabel: string;
  onConfirm: (values: { text: string; file: File | null }) => Promise<void>;
};

type Props = {
  modalId: string;
  request: ActionRequest | null;
  onClose: () => void;
};
