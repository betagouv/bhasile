"use client";

import { ReactElement } from "react";

import { ListLoader } from "@/app/components/lists/ListLoader";
import { useOperateurSearch } from "@/app/hooks/useOperateurSearch";

import { SearchBar } from "../structures/_components/SearchBar";
import { OperateurList } from "./OperateursList";

export default function Operateurs(): ReactElement {
  const { operateurs, totalOperateurs } = useOperateurSearch();

  return (
    <div className="h-full w-full flex flex-col bg-alt-grey">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <h2
          className="text-title-blue-france fr-h5 mr-4 mb-0"
          id="operateurs-titre"
        >
          Opérateurs
        </h2>
        <div className="flex items-center">
          <SearchBar
            placeholder="Nom d'opérateur"
            inputId="operateurs-search"
          />
          <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
            {totalOperateurs ?? 0} entrée
            {(totalOperateurs ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <ListLoader
        fetchStateName={"operateurs-search"}
        items={operateurs}
        entityName="operateur"
      >
        {operateurs && (
          <OperateurList
            operateurs={operateurs}
            totalOperateurs={totalOperateurs}
          />
        )}
      </ListLoader>
    </div>
  );
}
