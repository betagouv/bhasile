"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";

import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { parseCommaList } from "@/app/utils/string.util";

export const useFilterSelection = (filterId: string): FilterSelection => {
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();
  const [selection, setOptimisticSelection] = useOptimistic(
    parseCommaList(searchParams.get(filterId))
  );
  const [isCleared, setIsCleared] = useState(false);

  const getStatus = (): FilterStatus => {
    if (isCleared) {
      return "none";
    }
    return selection.length === 0 ? "all" : "some";
  };
  const status = getStatus();

  const setSelection = (nextSelection: string[]) => {
    if (selection.length === 0 && nextSelection.length === 0) {
      return;
    }
    startTransition(() => {
      setOptimisticSelection(nextSelection);
      navigateWithFilter(filterId, nextSelection, { scroll: false });
    });
  };

  const getCheckedValues = (allValues: string[]): string[] => {
    if (status === "all") {
      return allValues;
    }
    return status === "none" ? [] : selection;
  };

  const setCheckedValues = (checkedValues: string[], allValues: string[]) => {
    const isEverythingChecked = allValues.every((value) =>
      checkedValues.includes(value)
    );
    setIsCleared(checkedValues.length === 0);
    setSelection(isEverythingChecked ? [] : checkedValues);
  };

  const toggleAll = () => {
    setIsCleared(status === "all");
    setSelection([]);
  };

  const resetCleared = () => setIsCleared(false);

  return {
    selection,
    status,
    getCheckedValues,
    setCheckedValues,
    toggleAll,
    resetCleared,
  };
};

export type FilterStatus = "all" | "some" | "none";

export type FilterSelection = {
  selection: string[];
  status: FilterStatus;
  getCheckedValues: (allValues: string[]) => string[];
  setCheckedValues: (checkedValues: string[], allValues: string[]) => void;
  toggleAll: () => void;
  resetCleared: () => void;
};
