"use client";

import { useCallback } from "react";

import { setFilterParam } from "@/app/utils/search-params.util";
import {
  isGlobalFilterKey,
  persistGlobalFilter,
} from "@/utils/global-filters.util";

import {
  SearchParamsNavigationOptions,
  useSearchParamsNavigation,
} from "./useSearchParamsNavigation";

export const useFilterNavigation = (): NavigateWithFilter => {
  const navigateWithParams = useSearchParamsNavigation();

  return useCallback(
    (key, values, options) => {
      if (isGlobalFilterKey(key)) {
        persistGlobalFilter(key, values);
      }
      navigateWithParams(
        (params) => setFilterParam(params, key, values),
        options
      );
    },
    [navigateWithParams]
  );
};

type NavigateWithFilter = (
  key: string,
  values: (string | number)[],
  options?: SearchParamsNavigationOptions
) => void;
