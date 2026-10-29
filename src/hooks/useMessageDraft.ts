"use client";

import { useState } from "react";

import { useMessageAttachments } from "./useMessageAttachments";

export const useMessageDraft = () => {
  const [text, setText] = useState("");
  const attachments = useMessageAttachments();

  const clear = () => {
    setText("");
    attachments.clearAttachments();
  };

  return { text, setText, attachments, clear };
};

export type MessageDraft = ReturnType<typeof useMessageDraft>;
