import { useRouter } from "next/navigation";

import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

import { useCpom } from "./useCpom";
import { useSaveMutation } from "./useSaveMutation";

export const useCpomFormHandling = ({ cpomId, nextRoute, callBack }: Props) => {
  const router = useRouter();

  const { updateCpom } = useCpom();
  const { mutate: saveCpom } = useSaveMutation(
    "cpom-save",
    (id: number, data: Partial<CpomFormValues>) => updateCpom(id, data)
  );

  const handleSubmit = async (data: Partial<CpomFormValues>) => {
    if (!cpomId) {
      return;
    }
    const result = await saveCpom(cpomId, data);
    if (result !== null) {
      if (nextRoute) {
        router.push(nextRoute);
      }
      if (callBack) {
        callBack();
      }
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
