"use client";

import { useFetchState } from "@/app/context/FetchStateContext";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import { FetchState } from "@/types/fetch-state.type";

export const ErrorToast = () => {
  const { fetchStates } = useFetchState();

  const hasSaveError = [...fetchStates].some(
    ([key, state]) => key.endsWith("-save") && state === FetchState.ERROR
  );

  if (!hasSaveError) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="flex gap-4 items-center w-lg fixed bottom-11 left-1/2 -translate-x-1/2 border border-action-high-error px-6 py-3 rounded-lg bg-contrast-error z-50"
    >
      <i className="fr-icon-error-fill text-default-error" aria-hidden="true" />
      <span>
        Vos données n’ont pas pu être sauvegardées, vérifiez votre connexion et
        réessayez. Si cela persiste,{" "}
        <a
          href={`mailto:${BHASILE_CONTACT_EMAIL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          contactez-nous
        </a>
        .
      </span>
    </div>
  );
};
