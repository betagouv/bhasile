"use client";

import { useState } from "react";

import { useMessageAttachments } from "./useMessageAttachments";

export const useMessageDraft = () => {
  const [text, setText] = useState("");
  const [tagKey, setTagKey] = useState<string | null>(null);
  const attachments = useMessageAttachments();

  const clear = () => {
    setText("");
    setTagKey(null);
    attachments.clearAttachments();
  };

  return { text, setText, tagKey, setTagKey, attachments, clear };
};

export type MessageDraft = ReturnType<typeof useMessageDraft>;
