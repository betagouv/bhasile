import { useRouter } from "next/navigation";

import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../(authenticated)/(with-menu)/cpoms/[id]/_context/CpomClientContext";
import { useFetchState } from "../context/FetchStateContext";
import { ApiError } from "../utils/apiError.util";
import { useCpom } from "./useCpom";

export const useCpomFormHandling = ({ cpomId, nextRoute, callBack }: Props) => {
  const router = useRouter();

  const { setCpom } = useCpomContext();
  const { updateCpom } = useCpom();
  const { setFetchState } = useFetchState();

  const handleSubmit = async (data: Partial<CpomFormValues>) => {
    if (!cpomId) {
      return;
    }
    setFetchState("cpom-save", FetchState.LOADING);
    try {
      await updateCpom(cpomId, data, setCpom);
      setFetchState("cpom-save", FetchState.IDLE);
      if (nextRoute) {
        router.push(nextRoute);
      }
      if (callBack) {
        callBack();
      }
    } catch (error) {
      setFetchState(
        "cpom-save",
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
  cpomId?: number;
  nextRoute?: string;
  callBack?: () => void;
};
