"use client";

import { useEffect, useRef, useState } from "react";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";
import { cn } from "@/app/utils/classname.util";

// TODO: make this component generic and reusable
export const Autocomplete = function Autocomplete<
  T extends AutocompleteSuggestion,
>({
  suggestions,
  isLoading,
  showSuggestions,
  className = "",
  listClassName = "",
  renderSuggestion,
  onSelect,
  emptyMessage,
}: AutocompleteProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (onSelect) {
          onSelect(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onSelect]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (e.key === "Tab") {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (onSelect) {
        onSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (onSelect) {
        onSelect(null);
      }
    }
  };

  const shouldShowEmptyMessage =
    showSuggestions && emptyMessage && suggestions.length === 0;

  if (!showSuggestions) {
    return null;
  }

  if (suggestions.length === 0 && !shouldShowEmptyMessage) {
    return null;
  }

  const handleSelectSuggestion = (suggestion: T) => {
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const getAutocompleteHint = () => {
    if (suggestions.length === 0) {
      return isLoading ? "Chargement..." : emptyMessage;
    }
    return "Sélectionnez un élément dans la liste";
  };

  return (
    <div
      className={cn(
        "shadow-md absolute top-0 bg-white border-gray-300 pb-0 z-10 w-full overflow-y-auto m-0 p-2",
        className
      )}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          if (onSelect) {
            onSelect(null);
          }
        }
      }}
      tabIndex={-1}
    >
      <div
        className="text-center text-xs bg-gray-50 p-2"
        aria-live="polite"
        role="status"
      >
        {getAutocompleteHint()}
      </div>

      <ul
        id="autocomplete-suggestions"
        role="listbox"
        aria-label="Suggestions"
        className={cn("list-none p-0 m-0", listClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {suggestions.map((suggestion, index) => (
          <li
            id={`suggestion-${index}`}
            key={suggestion.id || index}
            role="option"
            aria-selected={activeIndex === index}
            className={cn(
              "px-3 py-2 cursor-pointer",
              activeIndex === index ? "bg-gray-100" : "hover:bg-gray-100",
              index < suggestions.length - 1 ? "border-b border-gray-200" : ""
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelectSuggestion(suggestion);
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelectSuggestion(suggestion);
              }
            }}
            tabIndex={0}
          >
            {renderSuggestion ? renderSuggestion(suggestion) : suggestion.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

type AutocompleteProps<T extends AutocompleteSuggestion> = {
  suggestions: T[];
  isLoading: boolean;
  showSuggestions: boolean;
  className?: string;
  listClassName?: string;
  renderSuggestion?: (suggestion: T) => React.ReactNode;
  onSelect?: (suggestion: T | null) => void;
  emptyMessage?: string;
};
