import { PropsWithChildren, ReactElement } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import Loader from "../ui/Loader";

export const ListLoader = ({
  fetchStateName,
  items,
  entityName,
  children,
}: Props): ReactElement => {
  const { getFetchState } = useFetchState();
  const fetchState = getFetchState(fetchStateName);

  return (
    <>
      {fetchState === FetchState.LOADING && (
        <div className="flex items-center px-4">
          <Loader />
          <span className="pl-2">Chargement des {entityName}s...</span>
        </div>
      )}
      {fetchState === FetchState.ERROR && (
        <div className="flex items-center px-4">
          <span className="pl-2">
            Erreur lors de la récupération des {entityName}s
          </span>
        </div>
      )}
      {fetchState === FetchState.IDLE &&
        items &&
        (items?.length > 0 ? (
          children
        ) : (
          <p className="p-2">Aucun(e) {entityName} trouvé(e)</p>
        ))}
    </>
  );
};

type Props = PropsWithChildren<{
  fetchStateName: string;
  items: unknown[] | undefined;
  entityName: string;
}>;
