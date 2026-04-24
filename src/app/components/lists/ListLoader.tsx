import { PropsWithChildren, ReactElement } from "react";

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
}: Props): ReactElement => {
  const { getFetchState } = useFetchState();
  const fetchState = getFetchState(fetchStateName);
  const entity = LIST_ENTITIES[entityName];

  return (
    <>
      {fetchState === FetchState.ERROR && (
        <div className="flex items-center px-4">
          <span className="pl-2">
            Erreur lors de la récupération des {entity.plural}
          </span>
        </div>
      )}
      {fetchState !== FetchState.ERROR &&
        items &&
        (items?.length > 0 ? (
          <div
            className={`${fetchState === FetchState.LOADING ? "opacity-20 pointer-events-none" : ""}`}
          >
            {children}
          </div>
        ) : (
          <p className="p-16">{formatEmptyList(entity)}</p>
        ))}
    </>
  );
};

type Props = PropsWithChildren<{
  fetchStateName: string;
  items: unknown[] | undefined;
  entityName: ListEntityKey;
}>;
