import { useRouter } from "next/navigation";

import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useOperateurContext } from "../(authenticated)/(with-menu)/operateurs/[id]/_context/OperateurClientContext";
import { useFetchState } from "../context/FetchStateContext";
import { ApiError } from "../utils/apiError.util";
import { useOperateur } from "./useOperateur";

export const useOperateurFormHandling = ({
  operateurId,
  nextRoute,
  callBack,
}: Props) => {
  const router = useRouter();

  const { setOperateur } = useOperateurContext();

  const { updateOperateur } = useOperateur();

  const { setFetchState } = useFetchState();

  const handleSubmit = async (data: Partial<OperateurUpdateFormValues>) => {
    setFetchState("operateur-save", FetchState.LOADING);
    try {
      await updateOperateur({ id: operateurId, ...data }, setOperateur);
      setFetchState("operateur-save", FetchState.IDLE);
      if (nextRoute) {
        router.push(nextRoute);
      }
      if (callBack) {
        callBack();
      }
    } catch (error) {
      setFetchState(
        "operateur-save",
        FetchState.ERROR,
        error instanceof ApiError ? error.message : undefined
      );
    }
  };

  return {
    handleSubmit,
  };
};

export type Props = {
  operateurId?: number;
  nextRoute?: string;
  callBack?: () => void;
};
