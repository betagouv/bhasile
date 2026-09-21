"use client";

import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useState } from "react";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";
import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { SEARCH_PARAM_DEBOUNCE_MS } from "@/constants";

export const ResourcesSearch = ({ suggestions }: Props): ReactElement => {
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? ""
  );

  const applySearch = (searchQuery: string): void => {
    if ((searchParams.get("search") ?? "") === searchQuery) {
      return;
    }

    navigateWithFilter("search", searchQuery.length > 0 ? [searchQuery] : [], {
      scroll: false,
    });
  };

  const debouncedApplySearch = useDebounceCallback<
    (searchQuery: unknown) => void
  >(
    (searchQuery: unknown) => applySearch(searchQuery as string),
    SEARCH_PARAM_DEBOUNCE_MS
  );

  useEffect(() => {
    debouncedApplySearch(searchTerm);
  }, [searchTerm, debouncedApplySearch]);

  const handleSuggestionClick = (suggestionItem: string): void => {
    setSearchTerm(suggestionItem);
    applySearch(suggestionItem);
  };

  return (
    <div className="bg-alt-grey mt-20 mb-10">
      <h2 className="max-w-lg mx-auto text-5xl text-title-blue-france text-center leading-14 mb-8">
        Sur quel sujet peut-on vous aider&nbsp;?
      </h2>

      <div className="max-w-2xl mx-auto">
        <SearchBar
          big
          label="Rechercher"
          className="mb-8"
          allowEmptySearch
          onButtonClick={() => applySearch(searchTerm)}
          renderInput={({ className, id, type, placeholder }) => (
            <input
              className={className}
              id={id}
              type={type}
              placeholder={placeholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          )}
        />

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {suggestions.map((suggestionItem) => (
              <Tag
                key={suggestionItem}
                small
                nativeButtonProps={{
                  onClick: () => handleSuggestionClick(suggestionItem),
                }}
              >
                {suggestionItem}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

type Props = {
  suggestions: string[];
};
