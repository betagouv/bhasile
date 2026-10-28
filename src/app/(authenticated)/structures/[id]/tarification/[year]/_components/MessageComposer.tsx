"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { ChangeEvent, FormEvent, ReactElement, useRef, useState } from "react";

import { ALLOWED_MIME_TYPES } from "@/constants";
import { useMessageAttachments } from "@/hooks/useMessageAttachments";
import { MESSAGE_MAX_LENGTH } from "@/schemas/api/message.schema";

import { AttachmentChip } from "./AttachmentChip";

export const MessageComposer = ({ onSend }: Props): ReactElement => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    attachments,
    addFiles,
    removeAttachment,
    clearAttachments,
    fileKeys,
    isUploading,
    hasUploadError,
  } = useMessageAttachments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasContent = text.trim().length > 0 || fileKeys.length > 0;
  const canSend = hasContent && !isUploading && !hasUploadError && !isSending;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    setIsSending(true);
    setErrorMessage(null);
    try {
      await onSend({ text, fileKeys });
      setText("");
      clearAttachments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Le message n’a pas pu être envoyé."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        label="Message"
        hideLabel
        textArea
        state={errorMessage ? "error" : "default"}
        stateRelatedMessage={errorMessage ?? undefined}
        nativeTextAreaProps={{
          value: text,
          rows: 3,
          maxLength: MESSAGE_MAX_LENGTH,
          readOnly: isSending,
          placeholder: "Écrivez un message",
          onChange: (event) => setText(event.target.value),
        }}
      />
      {attachments.length > 0 && (
        <ul
          aria-label="Pièces jointes"
          className="list-none p-0 m-0 flex flex-wrap gap-2"
        >
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              attachment={attachment}
              canRemove={!isSending}
              onRemove={() => removeAttachment(attachment.id)}
            />
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ALLOWED_MIME_TYPES.join(",")}
          aria-label="Fichiers à joindre"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          priority="secondary"
          iconId="fr-icon-attachment-line"
          disabled={isSending}
          onClick={() => fileInputRef.current?.click()}
        >
          Joindre des fichiers
        </Button>
        <Button type="submit" disabled={!canSend}>
          Envoyer
        </Button>
      </div>
    </form>
  );
};

type Props = {
  onSend: (message: { text: string; fileKeys: string[] }) => Promise<void>;
};
