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
  const [lastUrlSearchTerm, setLastUrlSearchTerm] = useState(urlSearchTerm);
  const pushedSearchTerm = useRef(urlSearchTerm);

  if (urlSearchTerm !== lastUrlSearchTerm) {
    setLastUrlSearchTerm(urlSearchTerm);
    if (urlSearchTerm !== pushedSearchTerm.current) {
      setSearchTerm(urlSearchTerm);
    }
  }

  const handleSearchUpdate = useDebounceCallback((): void => {
    pushedSearchTerm.current = searchTerm;
    navigateWithFilter("search", searchTerm.length > 0 ? [searchTerm] : []);
  }, SEARCH_PARAM_DEBOUNCE_MS);

  useEffect(() => {
    handleSearchUpdate();
  }, [searchTerm, handleSearchUpdate]);

  return (
    <div className="border border-disabled-grey h-8 flex items-center bg-white">
      <span className="fr-icon-search-line fr-icon--sm text-label-blue-france px-2" />
      <input
        type="text"
        placeholder={placeholder}
        id={inputId}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

type Props = {
  placeholder: string;
  inputId: string;
};
