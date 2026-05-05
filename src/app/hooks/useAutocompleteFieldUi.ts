"use client";

import { useEffect, useState } from "react";

import {
  AutocompleteSuggestion,
  useAutocomplete,
} from "@/app/hooks/useAutocomplete";

type Params<T extends AutocompleteSuggestion> = {
  value: string;
  fetchSuggestions: (query: string) => Promise<T[]>;
  debounceMs?: number;
  searchTermLength?: number;
  notSelectedError?: string;
  onValueChange: (next: string) => void;
  onConfirmSelection: (suggestion: T) => void;
  onClear?: () => void;
  onBlurExtra?: () => void;
};

export const useAutocompleteFieldUi = <T extends AutocompleteSuggestion>({
  value,
  fetchSuggestions,
  debounceMs,
  searchTermLength,
  notSelectedError,
  onValueChange,
  onConfirmSelection,
  onClear,
  onBlurExtra,
}: Params<T>) => {
  const [manualError, setManualError] = useState<string | undefined>(undefined);
  const [hasSelected, setHasSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const {
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    handleInputChange,
    resetSuggestions,
  } = useAutocomplete<T>(fetchSuggestions, debounceMs, searchTermLength);

  const markSelected = () => {
    setHasSelected(true);
    setManualError(undefined);
  };

  const handleSelectSuggestion = (
    suggestion: AutocompleteSuggestion | null
  ) => {
    if (!suggestion) {
      resetSuggestions();
      return;
    }
    markSelected();
    onConfirmSelection(suggestion as T);
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    onValueChange(next);
    handleInputChange(next);
    setHasInteracted(true);

    if (next) {
      setHasSelected(false);
    } else {
      onClear?.();
    }
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    onBlurExtra?.();
    setIsFocused(false);
    if (hasInteracted && !hasSelected && value && notSelectedError) {
      setManualError(notSelectedError);
    } else {
      setManualError(undefined);
    }
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    setIsFocused(true);
  };

  useEffect(() => {
    if (
      !isFocused &&
      hasInteracted &&
      !hasSelected &&
      value &&
      notSelectedError
    ) {
      setManualError(notSelectedError);
    } else if (!value || hasSelected) {
      setManualError(undefined);
    }
  }, [isFocused, hasInteracted, hasSelected, value, notSelectedError]);

  return {
    suggestions,
    isLoading,
    showSuggestions,
    manualError,
    handleSelectSuggestion,
    handleChange,
    handleBlur,
    handleFocus,
  };
};
