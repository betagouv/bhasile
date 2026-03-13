import { useRouter } from "next/navigation";
import { useState } from "react";

import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../(authenticated)/cpoms/[id]/_context/CpomClientContext";
import { useFetchState } from "../context/FetchStateContext";
import { useCpom } from "./useCpom";

export const useCpomFormHandling = ({ nextRoute, callBack }: Props = {}) => {
  const router = useRouter();

  const { setCpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const { setFetchState } = useFetchState();

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: CpomFormValues) => {
    setFetchState("cpom-save", FetchState.LOADING);
    try {
      const result = await updateCpom(data, setCpom);
      if (typeof result === "object" && "cpomId" in result) {
        setFetchState("cpom-save", FetchState.IDLE);
        if (nextRoute) {
          router.push(nextRoute);
        }
        if (callBack) {
          callBack();
        }
      } else {
        setFetchState("cpom-save", FetchState.ERROR);
        setBackendError(result);
        console.error(result);
      }
    } catch (error) {
      setFetchState("cpom-save", FetchState.ERROR);
      setBackendError(String(error));
      console.error(error);
    }
  };

  return {
    handleSubmit,
    backendError,
  };
};

export type Props = {
  nextRoute?: string;
  callBack?: () => void;
};
