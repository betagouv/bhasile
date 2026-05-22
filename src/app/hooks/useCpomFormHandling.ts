import { useRouter } from "next/navigation";
import { useState } from "react";

import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

import { useCpomContext } from "../(authenticated)/(with-menu)/cpoms/[id]/_context/CpomClientContext";
import { useCpom } from "./useCpom";

export const useCpomFormHandling = ({ cpomId, nextRoute, callBack }: Props) => {
  const router = useRouter();

  const { setCpom } = useCpomContext();
  const { updateCpom } = useCpom();

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: Partial<CpomFormValues>) => {
    try {
      await updateCpom(cpomId!, data, setCpom);
      if (nextRoute) {
        router.push(nextRoute);
      }
      if (callBack) {
        callBack();
      }
    } catch (error) {
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
  cpomId?: number;
  nextRoute?: string;
  callBack?: () => void;
};
