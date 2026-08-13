import { useRouter } from "next/navigation";

import { useCpomContext } from "@/contexts/CpomContext";
import { CpomFormValues } from "@/schemas/forms/base/cpom.schema";

import { useCpom } from "./useCpom";
import { useSaveMutation } from "./useSaveMutation";

export const useCpomFormHandling = ({ cpomId, nextRoute, callBack }: Props) => {
  const router = useRouter();

  const { setCpom } = useCpomContext();
  const { updateCpom } = useCpom();
  const { mutate: saveCpom } = useSaveMutation(
    "cpom-save",
    (id: number, data: Partial<CpomFormValues>) => updateCpom(id, data, setCpom),
    // shouldRefresh: false tant que cette entité passe par refreshBestEffort —
    // à retirer avec sa migration en RSC.
    { shouldRefresh: false }
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
