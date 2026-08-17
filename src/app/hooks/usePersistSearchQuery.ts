"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function usePersistSearchQuery(
  targetPath: string,
  storageKey: string
): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (pathname !== targetPath) {
      return;
    }

    const queryString = searchParams.toString();

    if (isFirstMount.current) {
      isFirstMount.current = false;
      const stored = sessionStorage.getItem(storageKey) ?? "";

      if (!queryString && stored) {
        router.replace(`${targetPath}?${stored}`);
        return;
      }

      sessionStorage.setItem(storageKey, queryString);
      return;
    }

    sessionStorage.setItem(storageKey, queryString);
  }, [pathname, router, searchParams, targetPath, storageKey]);
}
