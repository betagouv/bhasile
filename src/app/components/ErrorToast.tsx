"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { getErrorEmail } from "@/app/utils/errorMail.util";
import { FetchState } from "@/types/fetch-state.type";

import { ErrorDisclosure } from "./ErrorDisclosure";

export const ErrorToast = () => {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const { fetchStates, getErrorMessage, setFetchState } = useFetchState();

  const erroredKey = [...fetchStates].find(
    ([key, { state }]) => key.endsWith("-save") && state === FetchState.ERROR
  )?.[0];

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }
    previousPathnameRef.current = pathname;
    fetchStates.forEach(({ state }, key) => {
      if (key.endsWith("-save") && state === FetchState.ERROR) {
        setFetchState(key, FetchState.IDLE);
      }
    });
  }, [pathname, fetchStates, setFetchState]);

  if (!erroredKey) {
    return null;
  }

  const message = getErrorMessage(erroredKey);

  return (
    <div className="flex gap-4 items-start w-lg max-w-[calc(100vw-2rem)] fixed bottom-11 left-1/2 -translate-x-1/2 border border-action-high-error px-6 py-3 rounded-lg bg-contrast-error z-50">
      <i
        className="fr-icon-error-fill text-default-error shrink-0"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1">
        <p role="alert" aria-atomic="true" className="text-sm m-0">
          Vos données n’ont pas pu être sauvegardées. Veuillez réessayer{" "}
          <a
            href={getErrorEmail(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Si cela persiste, contactez-nous.
          </a>
        </p>
        <div className="flex flex-col gap-1">
          {message && <ErrorDisclosure message={message} />}
        </div>
      </div>
    </div>
  );
};
