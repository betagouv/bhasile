"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  omitGlobalFilters,
  pickGlobalFilters,
} from "@/utils/global-filters.util";

export function usePersistSearchQuery(
  targetPath: string,
  storageKey: string
): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== targetPath) {
      return;
    }

    const queryString = omitGlobalFilters(searchParams).toString();
    const stored = sessionStorage.getItem(storageKey) ?? "";

    if (!queryString) {
      const referrer = document.referrer;
      const isComingFromChildPage =
        referrer && new URL(referrer).pathname.startsWith(`${targetPath}/`);

      if (isComingFromChildPage && stored) {
        const restored = new URLSearchParams(stored);
        pickGlobalFilters(searchParams).forEach((value, key) =>
          restored.set(key, value)
        );
        router.replace(`${targetPath}?${restored.toString()}`);
        return;
      }

      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, queryString);
  }, [pathname, router, searchParams, targetPath, storageKey]);
}
