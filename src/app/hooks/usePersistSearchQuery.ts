"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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

    const queryString = searchParams.toString();
    const stored = sessionStorage.getItem(storageKey) ?? "";

    if (!queryString) {
      const referrer = document.referrer;
      const isComingFromChildPage =
        referrer && new URL(referrer).pathname.startsWith(`${targetPath}/`);

      if (isComingFromChildPage && stored) {
        router.replace(`${targetPath}?${stored}`);
        return;
      }

      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, queryString);
  }, [pathname, router, searchParams, targetPath, storageKey]);
}
