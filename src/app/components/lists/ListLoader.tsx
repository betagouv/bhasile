import { PropsWithChildren } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import Loader from "../ui/Loader";
import {
  formatEmptyList,
  LIST_ENTITIES,
  ListEntityKey,
} from "./entitiesConstants";

export const ListLoader = ({
  fetchStateName,
  items,
  entityName,
  children,
}: Props) => {
  const { getFetchState } = useFetchState();
  const fetchState = getFetchState(fetchStateName);
  const entity = LIST_ENTITIES[entityName];

  if (fetchState === FetchState.ERROR) {
    return (
      <p className="p-16">Erreur lors de la récupération des {entity.plural}</p>
    );
  }

  if (!items && fetchState !== FetchState.LOADING) {
    return null;
  }

  if (!items || items.length === 0) {
    if (fetchState === FetchState.LOADING) {
      return (
        <div className="flex items-center p-16 gap-4">
          <Loader />
          <span>Chargement des {entity.plural}...</span>
        </div>
      );
    } else {
      return <p className="p-16">{formatEmptyList(entity)}</p>;
    }
  }

  return (
    <div
      className={`${fetchState === FetchState.LOADING ? "opacity-20 pointer-events-none" : ""}`}
    >
      {children}
    </div>
  );
};

type Props = PropsWithChildren<{
  fetchStateName: string;
  items: unknown[] | undefined;
  entityName: ListEntityKey;
}>;
