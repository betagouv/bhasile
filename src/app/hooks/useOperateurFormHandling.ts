import { useRouter } from "next/navigation";
import { useState } from "react";

import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useOperateurContext } from "../(authenticated)/(with-menu)/operateurs/[id]/_context/OperateurClientContext";
import { useFetchState } from "../context/FetchStateContext";
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

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: Partial<OperateurUpdateFormValues>) => {
    setFetchState("operateur-save", FetchState.LOADING);
    try {
      const result = await updateOperateur(
        { id: operateurId, ...data },
        setOperateur
      );
      if (typeof result === "object" && "operateurId" in result) {
        setFetchState("operateur-save", FetchState.IDLE);
        if (nextRoute) {
          router.push(nextRoute);
        }
        if (callBack) {
          callBack();
        }
      } else {
        setFetchState("operateur-save", FetchState.ERROR);
        setBackendError(result);
        console.error(result);
      }
    } catch (error) {
      setFetchState("operateur-save", FetchState.ERROR);
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
  operateurId?: number;
  nextRoute?: string;
  callBack?: () => void;
};
