"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useListNavigation } from "./useListNavigation";

export const useSearchParamsNavigation = (): NavigateWithParams => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startNavigation = useListNavigation();

  return useCallback(
    (mutate, options) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      mutate(params);
      const href = `${options?.pathname ?? ""}?${params.toString()}`;
      startNavigation(() =>
        router.replace(href, { scroll: options?.scroll ?? true })
      );
    },
    [router, searchParams, startNavigation]
  );
};

type NavigateWithParams = (
  mutate: (params: URLSearchParams) => void,
  options?: SearchParamsNavigationOptions
) => void;

type SearchParamsNavigationOptions = {
  pathname?: string;
  scroll?: boolean;
};
