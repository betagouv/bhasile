"use client";

import { useCallback } from "react";

import { setFilterParam } from "@/app/utils/search-params.util";
import {
  isFilterKey,
  persistFilter,
} from "@/utils/filters.util";

import {
  SearchParamsNavigationOptions,
  useSearchParamsNavigation,
} from "./useSearchParamsNavigation";

export const useFilterNavigation = (): NavigateWithFilter => {
  const navigateWithParams = useSearchParamsNavigation();

  return useCallback(
    (key, values, options) => {
      if (isFilterKey(key)) {
        persistFilter(key, values);
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
