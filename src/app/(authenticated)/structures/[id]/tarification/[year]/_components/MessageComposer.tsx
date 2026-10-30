"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { FormEvent, ReactElement, useState } from "react";

import { ApiError } from "@/app/utils/api-error.util";
import { MessageDraft } from "@/hooks/useMessageDraft";

export const MessageComposer = ({ draft, onSend }: Props): ReactElement => {
  const { text, setText } = draft;
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmpty = text.trim().length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty || isSending) {
      return;
    }
    setIsSending(true);
    setErrorMessage(null);
    try {
      await onSend(text);
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
          placeholder: "Écrivez un message",
          onChange: (event) => setText(event.target.value),
        }}
      />
      <Button
        type="submit"
        disabled={isEmpty || isSending}
        className="self-end"
      >
        Envoyer
      </Button>
    </form>
  );
};

type Props = {
  draft: MessageDraft;
  onSend: (text: string) => Promise<void>;
};
