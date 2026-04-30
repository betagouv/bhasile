"use client";

import { useFetchState } from "@/app/context/FetchStateContext";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import { FetchState } from "@/types/fetch-state.type";

export const AutoSaveErrorToast = () => {
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  if (saveState !== FetchState.ERROR) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="flex gap-4 items-center w-lg fixed bottom-11 left-1/2 -translate-x-1/2 border border-action-high-error px-6 py-3 rounded-lg bg-contrast-error "
    >
      <i className="fr-icon-error-fill text-default-error" aria-hidden="true" />
      <span>
        Votre avancée n’a pas pu être sauvegardée, vérifiez votre connexion. Si
        cela persiste,{" "}
        <a
          href={`mailto:${BHASILE_CONTACT_EMAIL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          prévenez-nous.
        </a>
      </span>
    </div>
  );
};
