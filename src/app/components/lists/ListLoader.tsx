"use client";

import { PropsWithChildren, ReactElement } from "react";

import { useFetchState } from "@/contexts/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

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
