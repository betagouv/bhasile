"use client";

import { useCallback } from "react";

import { setFilterParam } from "@/app/utils/search-params.util";
import {
  isGlobalFilterKey,
  persistGlobalFilters,
} from "@/utils/global-filters.util";

import {
  SearchParamsNavigationOptions,
  useSearchParamsNavigation,
} from "./useSearchParamsNavigation";

export const useFilterNavigation = (): NavigateWithFilter => {
  const navigateWithParams = useSearchParamsNavigation();

  return useCallback(
    (key, values, options) =>
      navigateWithParams((params) => {
        setFilterParam(params, key, values);
        if (isGlobalFilterKey(key)) {
          persistGlobalFilters(params);
        }
      }, options),
    [navigateWithParams]
  );
};

type NavigateWithFilter = (
  key: string,
  values: (string | number)[],
  options?: SearchParamsNavigationOptions
) => void;
