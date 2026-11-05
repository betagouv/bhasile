"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { ChangeEvent, FormEvent, ReactElement, useRef, useState } from "react";

import { ApiError } from "@/app/utils/api-error.util";
import { ALLOWED_MIME_TYPES } from "@/constants";
import { MessageDraft } from "@/hooks/useMessageDraft";
import { ConversationTag } from "@/types/conversation.type";

import { AttachmentChip } from "./AttachmentChip";
import { TagSelect } from "./TagSelect";

export const MessageComposer = ({
  tags,
  canTag,
  draft,
  onSend,
}: Props): ReactElement => {
  const { text, setText, tagKey, setTagKey } = draft;
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    attachments,
    addFiles,
    removeAttachment,
    fileKeys,
    isUploading,
    hasUploadError,
  } = draft.attachments;
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
      await onSend({ text, fileKeys, tagKey });
      draft.clear();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Le message n’a pas pu être envoyé."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 flex flex-col gap-3 p-4 rounded-[10px] bg-white"
    >
      <Input
        label="Message"
        hideLabel
        textArea
        classes={{
          nativeInputOrTextArea: "bg-transparent! shadow-none! p-0!",
        }}
        state={errorMessage ? "error" : "default"}
        stateRelatedMessage={errorMessage ?? undefined}
        nativeTextAreaProps={{
          value: text,
          rows: 3,
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
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ALLOWED_MIME_TYPES.join(",")}
          aria-label="Fichiers à joindre"
          onChange={handleFileChange}
        />
        {canTag && (
          <div className="mr-auto">
            <TagSelect
              tags={tags}
              value={tagKey}
              isDisabled={isSending}
              onChange={setTagKey}
            />
          </div>
        )}
        <Button
          type="button"
          priority="secondary"
          size="small"
          iconId="fr-icon-attachment-line"
          disabled={isSending}
          onClick={() => fileInputRef.current?.click()}
        >
          Joindre des fichiers
        </Button>
        <Button
          type="submit"
          size="small"
          iconId="fr-icon-send-plane-fill"
          disabled={!canSend}
        >
          Envoyer
        </Button>
      </div>
    </form>
  );
};

type Props = {
  tags: ConversationTag[];
  canTag: boolean;
  draft: MessageDraft;
  onSend: (message: {
    text: string;
    fileKeys: string[];
    tagKey: string | null;
  }) => Promise<void>;
};
