import { PropsWithChildren, ReactElement } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import Loader from "../ui/Loader";
import {
  formatEmptyList,
  LIST_ENTITIES,
  ListEntityKey,
} from "./EntitiesConstants";

export const ListLoader = ({
  fetchStateName,
  items,
  entity,
  children,
}: Props): ReactElement => {
  const { getFetchState } = useFetchState();
  const fetchState = getFetchState(fetchStateName);
  const entityDef = LIST_ENTITIES[entity];

  return (
    <>
      {fetchState === FetchState.LOADING && (
        <div className="flex items-center px-4">
          <Loader />
          <span className="pl-2">Chargement des {entityDef.plural}...</span>
        </div>
      )}
      {fetchState === FetchState.ERROR && (
        <div className="flex items-center px-4">
          <span className="pl-2">
            Erreur lors de la récupération des {entityDef.plural}
          </span>
        </div>
      )}
      {fetchState === FetchState.IDLE &&
        items &&
        (items?.length > 0 ? (
          children
        ) : (
          <p className="p-16">{formatEmptyList(entityDef)}</p>
        ))}
    </>
  );
};

type Props = PropsWithChildren<{
  fetchStateName: string;
  items: unknown[] | undefined;
  entity: ListEntityKey;
}>;
