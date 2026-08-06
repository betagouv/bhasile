"use client";
import { createContext, useCallback, useContext, useState } from "react";

import { ErrorToast } from "@/app/components/ErrorToast";
import { FetchState } from "@/types/fetch-state.type";

type FetchEntry = { state: FetchState; errorMessage?: string };

const FetchStateContext = createContext<FetchStateContextType | undefined>(
  undefined
);

export function FetchStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fetchStates, setFetchStates] = useState<Map<string, FetchEntry>>(
    new Map()
  );

  const setFetchState = useCallback(
    (key: string, state: FetchState, errorMessage?: string) => {
      setFetchStates((prev) =>
        new Map(prev).set(key, {
          state,
          errorMessage: state === FetchState.ERROR ? errorMessage : undefined,
        })
      );
    },
    []
  );

  const getFetchState = (key: string) =>
    fetchStates.get(key)?.state ?? FetchState.IDLE;

  const getErrorMessage = (key: string) => fetchStates.get(key)?.errorMessage;

  return (
    <FetchStateContext.Provider
      value={{ fetchStates, setFetchState, getFetchState, getErrorMessage }}
    >
      {children}
      <ErrorToast />
    </FetchStateContext.Provider>
  );
}

export const useFetchState = () => {
  const context = useContext(FetchStateContext);
  if (!context) {
    throw new Error("useFetchState must be used within FetchStateProvider");
  }
  return context;
};

type FetchStateContextType = {
  fetchStates: Map<string, FetchEntry>;
  setFetchState: (key: string, state: FetchState, errorMessage?: string) => void;
  getFetchState: (key: string) => FetchState;
  getErrorMessage: (key: string) => string | undefined;
};
