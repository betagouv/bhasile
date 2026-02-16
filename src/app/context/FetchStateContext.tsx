"use client";
import { createContext, useCallback, useContext, useState } from "react";

import { FetchState } from "@/types/fetch-state.type";

const FetchStateContext = createContext<FetchStateContextType | undefined>(
  undefined
);

export function FetchStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fetchStates, setFetchStates] = useState<Map<string, FetchState>>(
    new Map()
  );

  const setFetchState = useCallback((key: string, state: FetchState) => {
    setFetchStates((prev) => new Map(prev).set(key, state));
  }, []);

  const getFetchState = (key: string) => {
    return fetchStates.get(key) || FetchState.IDLE;
  };

  return (
    <FetchStateContext.Provider
      value={{ fetchStates, setFetchState, getFetchState }}
    >
      {children}
    </FetchStateContext.Provider>
  );
}

export const useFetchState = () => {
  const context = useContext(FetchStateContext);
  if (!context)
    {throw new Error("useFetchState must be used within FetchStateProvider");}
  return context;
};

type FetchStateContextType = {
  fetchStates: Map<string, FetchState>;
  setFetchState: (key: string, state: FetchState) => void;
  getFetchState: (key: string) => FetchState;
};
