import { FetchState } from "@/types/fetch-state.type";

import { useFetchState } from "../context/FetchStateContext";
import { ApiError } from "../utils/apiError.util";

export const useSaveMutation = <TArgs extends unknown[], TData>(
  saveKey: string,
  mutationFn: (...args: TArgs) => Promise<TData>
) => {
  const { setFetchState } = useFetchState();

  const mutate = async (...args: TArgs): Promise<TData | null> => {
    setFetchState(saveKey, FetchState.LOADING);
    try {
      const data = await mutationFn(...args);
      setFetchState(saveKey, FetchState.IDLE);
      return data;
    } catch (error) {
      setFetchState(
        saveKey,
        FetchState.ERROR,
        error instanceof ApiError ? error.message : undefined
      );
      return null;
    }
  };

  return { mutate };
};
