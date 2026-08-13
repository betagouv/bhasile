"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useRef, useState } from "react";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";
import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { SEARCH_PARAM_DEBOUNCE_MS } from "@/constants";

export const SearchBar = ({ placeholder, inputId }: Props): ReactElement => {
  const searchParams = useSearchParams();
  const navigateWithFilter = useFilterNavigation();

  const urlSearchTerm = searchParams.get("search") ?? "";
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  const handleSearchUpdate = useDebounceCallback((): void => {
    if (searchTerm === urlSearchTerm) {
      return;
    }
    pushedSearchTerm.current = searchTerm;
    navigateWithFilter("search", searchTerm.length > 0 ? [searchTerm] : []);
  }, SEARCH_PARAM_DEBOUNCE_MS);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    updateUrl(value);
  };

  return (
    <div className="border border-disabled-grey h-8 flex items-center bg-white">
      <span className="fr-icon-search-line fr-icon--sm text-label-blue-france px-2" />
      <input
        type="text"
        placeholder={placeholder}
        id={inputId}
        value={searchTerm}
        onChange={handleChange}
      />
    </div>
  );
};

type Props = {
  placeholder: string;
  inputId: string;
};
