"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useState } from "react";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";
import { useListNavigation } from "@/app/hooks/useListNavigation";
import { SEARCH_PARAM_DEBOUNCE_MS } from "@/constants";

export const SearchBar = ({ placeholder, inputId }: Props): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startNavigation = useListNavigation();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const handleSearchUpdate = useDebounceCallback((): void => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    params.delete("page");

    if (searchTerm.length > 0) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }

    startNavigation(() => router.replace(`?${params.toString()}`));
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
