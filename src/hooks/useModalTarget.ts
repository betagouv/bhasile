"use client";

import { useState } from "react";

export const useModalTarget = <T>(modal: { open: () => void }) => {
  const [target, setTarget] = useState<T | null>(null);
  const [openCount, setOpenCount] = useState(0);

  const open = (nextTarget: T | null): void => {
    setTarget(nextTarget);
    setOpenCount((count) => count + 1);
    modal.open();
  };

  return { target, openCount, open };
};
