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

  const applySearch = (term: string): void => {
    if ((searchParams.get("search") ?? "") === term) {
      return;
    }

    navigateWithFilter("search", term.length > 0 ? [term] : [], {
      scroll: false,
    });
  };

  const updateSearchParam = useDebounceCallback(
    () => applySearch(searchTerm),
    SEARCH_PARAM_DEBOUNCE_MS
  );

  useEffect(() => {
    updateSearchParam();
  }, [searchTerm, updateSearchParam]);

  return (
    <div className="bg-alt-grey mt-20 mb-10">
      <h2 className="max-w-lg mx-auto text-5xl text-title-blue-france text-center leading-14 mb-8">
        Sur quel sujet peut‑on vous aider&nbsp;?
      </h2>

      <div className="max-w-2xl mx-auto">
        <SearchBar
          big
          label="Rechercher"
          className="mb-8"
          allowEmptySearch
          onButtonClick={applySearch}
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
            {suggestions.map((suggestion) => (
              <Tag
                key={suggestion}
                small
                nativeButtonProps={{
                  onClick: () => setSearchTerm(suggestion),
                }}
              >
                {suggestion}
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
