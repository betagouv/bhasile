"use client";

import { useCallback } from "react";

import { setFilterParam } from "@/app/utils/searchParams.util";

import { useSearchParamsNavigation } from "./useSearchParamsNavigation";

export const useFilterNavigation = (): NavigateWithFilter => {
  const navigateWithParams = useSearchParamsNavigation();

  return useCallback(
    (key, values, options) =>
      navigateWithParams(
        (params) => setFilterParam(params, key, values),
        options
      ),
    [navigateWithParams]
  );
};

type NavigateWithFilter = (
  key: string,
  values: (string | number)[],
  options?: { pathname?: string; scroll?: boolean }
) => void;
