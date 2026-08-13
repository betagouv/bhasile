"use client";

import { TransitionStartFunction, useEffect, useTransition } from "react";

import { LIST_NAVIGATION_KEY } from "@/constants";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

export const useListNavigation = (): TransitionStartFunction => {
  const { setFetchState } = useFetchState();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFetchState(
      LIST_NAVIGATION_KEY,
      isPending ? FetchState.LOADING : FetchState.IDLE
    );
  }, [isPending, setFetchState]);

  return startTransition;
};
