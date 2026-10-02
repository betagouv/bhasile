"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useOptimistic } from "react";

import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { toggleArrayValue } from "@/app/utils/common.util";
import { parseCommaList } from "@/app/utils/string.util";

export const useFilterSelection = (filterId: string): FilterSelection => {
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();
  const [selection, setOptimisticSelection] = useOptimistic(
    parseCommaList(searchParams.get(filterId))
  );

  const setSelection = (nextSelection: string[]) => {
    if (selection.length === 0 && nextSelection.length === 0) {
      return;
    }
    startTransition(() => {
      setOptimisticSelection(nextSelection);
      navigateWithFilter(filterId, nextSelection, { scroll: false });
    });
  };

  const toggleValue = (value: string) => {
    setSelection(toggleArrayValue(selection, value));
  };

  return { selection, setSelection, toggleValue };
};

export type FilterSelection = {
  selection: string[];
  setSelection: (nextSelection: string[]) => void;
  toggleValue: (value: string) => void;
};
