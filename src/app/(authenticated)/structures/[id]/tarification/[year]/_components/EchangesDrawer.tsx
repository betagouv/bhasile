"use client";

import { ReactElement, ReactNode, useEffect, useRef } from "react";

export const EchangesDrawer = ({ onClose, children }: Props): ReactElement => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={ECHANGES_TITLE_ID}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="m-0 ml-auto h-dvh max-h-none w-[70.5rem] max-w-full p-0 overflow-hidden rounded-l-[10px] bg-alt-blue-france shadow-[0_4px_6px_rgba(0,0,18,0.16)] backdrop:bg-black/50 transition-transform duration-300 ease-out starting:translate-x-full motion-reduce:transition-none"
    >
      {children}
    </dialog>
  );
};

export const ECHANGES_TITLE_ID = "echanges-title";

type Props = {
  onClose: () => void;
  children: ReactNode;
};
