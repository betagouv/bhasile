"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export const useDashboardParams = (): {
  isPending: boolean;
  setParams: (updates: Record<string, string>) => void;
} => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParams = (updates: Record<string, string>): void => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return { isPending, setParams };
};
