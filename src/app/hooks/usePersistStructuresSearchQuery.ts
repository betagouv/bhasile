import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const STORAGE_KEY = "structures-query";

export function usePersistStructuresSearchQuery(): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (pathname !== "/structures") {
      return;
    }

    const queryString = searchParams.toString();

    if (isFirstMount.current) {
      isFirstMount.current = false;
      const stored = sessionStorage.getItem(STORAGE_KEY) ?? "";
      if (!queryString && stored) {
        router.replace(`?${stored}`);
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, queryString);
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, queryString);
  }, [pathname, router, searchParams]);
}
