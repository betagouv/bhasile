"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { FormEvent, ReactElement, useState } from "react";

import { MESSAGE_MAX_LENGTH } from "@/schemas/api/message.schema";

export const MessageComposer = ({ onSend }: Props): ReactElement => {
  const [text, setText] = useState("");
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
      setText("");
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
  onSend: (text: string) => Promise<void>;
};
