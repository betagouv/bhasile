"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { ReactNode, Ref } from "react";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";

import { Autocomplete } from "./Autocomplete";
import { useAutocompleteFieldUi } from "./useAutocompleteFieldUi";

export type AutocompleteFieldProps<T extends AutocompleteSuggestion> = {
  id: string;
  name?: string;
  label: string;
  value: string;
  onValueChange: (next: string) => void;
  onSelect: (suggestion: T) => void;
  onClear?: () => void;
  onBlurExtra?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  fetchSuggestions: (query: string) => Promise<T[]>;
  debounceMs?: number;
  searchTermLength?: number;
  notSelectedError?: string;
  emptyMessage?: string;
  externalError?: string;
  externalInvalid?: boolean;
  hiddenInput?: ReactNode;
};

export const AutocompleteField = <T extends AutocompleteSuggestion>({
  id,
  name,
  label,
  value,
  onValueChange,
  onSelect,
  onClear,
  onBlurExtra,
  inputRef,
  fetchSuggestions,
  debounceMs,
  searchTermLength,
  notSelectedError,
  emptyMessage,
  externalError,
  externalInvalid,
  hiddenInput,
}: AutocompleteFieldProps<T>) => {
  const ui = useAutocompleteFieldUi<T>({
    value,
    fetchSuggestions,
    debounceMs,
    searchTermLength,
    notSelectedError,
    onValueChange,
    onConfirmSelection: onSelect,
    onClear,
    onBlurExtra,
  });

  const showSuggestionsActive = ui.showSuggestions && ui.suggestions.length > 0;

  return (
    <div className="relative">
      <Input
        nativeInputProps={{
          id,
          name,
          value,
          ref: inputRef,
          onChange: ui.handleChange,
          onFocus: ui.handleFocus,
          onBlur: ui.handleBlur,
          autoComplete: "off",
          type: "text",
          "aria-autocomplete": "list",
          "aria-controls": "autocomplete-suggestions",
          "aria-expanded": showSuggestionsActive,
          "aria-activedescendant": showSuggestionsActive
            ? "suggestion-0"
            : undefined,
          role: "combobox",
        }}
        label={label}
        state={externalInvalid || ui.manualError ? "error" : "default"}
        stateRelatedMessage={externalError || ui.manualError}
      />

      <Autocomplete
        suggestions={ui.suggestions}
        isLoading={ui.isLoading}
        showSuggestions={ui.showSuggestions}
        onSelect={ui.handleSelectSuggestion}
        listClassName="max-h-60"
        className="top-18"
        emptyMessage={emptyMessage}
      />
      {hiddenInput}
    </div>
  );
};
