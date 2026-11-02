"use client";

import Button from "@codegouvfr/react-dsfr/Button";
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
      aria-labelledby={TITLE_ID}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="m-0 ml-auto h-dvh max-h-none w-[64rem] max-w-full p-0 bg-white backdrop:bg-black/50"
    >
      <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 id={TITLE_ID} className="fr-h4 mb-0">
            Échanges
          </h2>
          <Button
            priority="tertiary no outline"
            iconId="fr-icon-close-line"
            title="Fermer les échanges"
            onClick={onClose}
          />
        </div>
        {children}
      </div>
    </dialog>
  );
};

const TITLE_ID = "echanges-title";

type Props = {
  onClose: () => void;
  children: ReactNode;
};
