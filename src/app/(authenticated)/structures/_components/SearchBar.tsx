"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useState } from "react";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";

const DEBOUNCE_TIME = 300;

export const SearchBar = (): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();

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

    router.replace(`?${params.toString()}`);
  }, DEBOUNCE_TIME);

  useEffect(() => {
    handleSearchUpdate();
  }, [searchTerm, handleSearchUpdate]);

  return (
    <div className="border border-disabled-grey h-8 flex items-center">
      <span className="fr-icon-search-line fr-icon--sm text-label-blue-france px-2" />
      <input
        type="text"
        placeholder="DNA ou commune"
        id="structures-search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
