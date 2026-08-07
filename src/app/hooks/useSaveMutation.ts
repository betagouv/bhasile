import { useRouter } from "next/navigation";

import { useFetchState } from "@/contexts/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import { ApiError } from "../utils/apiError.util";

export const useSaveMutation = <TArgs extends unknown[], TData>(
  saveKey: string,
  mutationFn: (...args: TArgs) => Promise<TData>,
  { shouldRefresh = true }: { shouldRefresh?: boolean } = {}
) => {
  const { setFetchState } = useFetchState();
  const router = useRouter();

  const mutate = async (...args: TArgs): Promise<TData | null> => {
    setFetchState(saveKey, FetchState.LOADING);
    try {
      const data = await mutationFn(...args);
      setFetchState(saveKey, FetchState.IDLE);

      if (shouldRefresh) {
        router.refresh();
      }

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
