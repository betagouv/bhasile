"use client";

import { PropsWithChildren, ReactElement } from "react";

import { useFetchState } from "@/contexts/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import Loader from "../ui/Loader";
import {
  formatEmptyList,
  LIST_ENTITIES,
  ListEntityKey,
} from "./entitiesConstants";

export const ListLoader = ({
  fetchStateName,
  itemCount,
  entityName,
  children,
}: Props): ReactElement => {
  const { getFetchState } = useFetchState();
  const fetchState = getFetchState(fetchStateName);
  const entity = LIST_ENTITIES[entityName];

  // TODO: ces deux branches ne servent plus qu'aux listes encore clientes
  // (cpoms, structures). Les supprimer une fois qu'elles seront en RSC : l'erreur
  // remonte alors à error.tsx et l'attente est tenue par <Suspense>.
  if (fetchState === FetchState.ERROR) {
    return (
      <p className="p-16">Erreur lors de la récupération des {entity.plural}</p>
    );
  }

  // TODO: deuxième branche à supprimer
  if (itemCount === undefined) {
    return (
      <div className="flex items-center p-16 gap-4">
        <Loader />
        <span>Chargement des {entity.plural}...</span>
      </div>
    );
  }

  if (itemCount === 0) {
    return <p className="p-16">{formatEmptyList(entity)}</p>;
  }

  return (
    <div
      className={
        fetchState === FetchState.LOADING ? "opacity-20 pointer-events-none" : ""
      }
    >
      {children}
    </div>
  );
};

type Props = PropsWithChildren<{
  fetchStateName: string;
  itemCount: number | undefined;
  entityName: ListEntityKey;
}>;
