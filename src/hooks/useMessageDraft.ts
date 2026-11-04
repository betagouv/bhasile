"use client";

import { useState } from "react";

export const useMessageDraft = () => {
  const [text, setText] = useState("");

  const clear = () => setText("");

  return { text, setText, clear };
};

export type MessageDraft = ReturnType<typeof useMessageDraft>;
