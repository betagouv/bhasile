"use client";

import { ReactElement } from "react";

import Loader from "@/app/components/ui/Loader";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useOperateurSearch } from "@/app/hooks/useOperateurSearch";
import { FetchState } from "@/types/fetch-state.type";

import { OperateurList } from "./OperateursList";

export default function Operateurs(): ReactElement {
  const { operateurs, totalOperateurs } = useOperateurSearch();

  const { getFetchState } = useFetchState();
  const fetchState = getFetchState("operateurs-search");

  return (
    <div className="h-full w-full flex flex-col bg-alt-grey">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <h2
          className="text-title-blue-france fr-h5 mr-4 mb-0"
          id="operateurs-titre"
        >
          Opérateurs
        </h2>
        <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
          {totalOperateurs ?? 0} entrée
          {(totalOperateurs ?? 0) > 1 ? "s" : ""}
        </p>
      </div>

      {fetchState === FetchState.LOADING && (
        <div className="flex items-center px-4">
          <Loader />
          <span className="pl-2">Chargement des opérateurs...</span>
        </div>
      )}
      {fetchState === FetchState.ERROR && (
        <div className="flex items-center px-4">
          <span className="pl-2">
            Erreur lors de la récupération des opérateurs
          </span>
        </div>
      )}
      {fetchState === FetchState.IDLE &&
        operateurs &&
        (operateurs?.length > 0 ? (
          <OperateurList
            operateurs={operateurs}
            totalOperateurs={totalOperateurs}
          />
        ) : (
          <p className="p-2">Aucun opérateur trouvé</p>
        ))}
    </div>
  );
}
