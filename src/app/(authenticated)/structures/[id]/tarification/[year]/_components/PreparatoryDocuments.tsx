"use client";

import { ReactElement, ReactNode, useState } from "react";

export const PreparatoryDocuments = ({
  isInitiallyOpen,
  children,
}: Props): ReactElement => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <nav aria-label="Documents préparatoires" className="flex flex-col gap-4">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between text-xs font-bold uppercase text-title-blue-france"
      >
        Documents préparatoires
        <span
          aria-hidden
          className={`fr-icon--sm ${
            isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
          }`}
        />
      </button>
      {isOpen && (
        <ul className="fr-raw-list p-0 m-0 flex flex-col gap-1.5">{children}</ul>
      )}
    </nav>
  );
};

type Props = {
  isInitiallyOpen: boolean;
  children: ReactNode;
};
