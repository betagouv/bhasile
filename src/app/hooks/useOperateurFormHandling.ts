import { useRouter } from "next/navigation";

import { OperateurUpdateFormValues } from "@/schemas/forms/base/operateur.schema";

import { useOperateur } from "./useOperateur";
import { useSaveMutation } from "./useSaveMutation";

export const useOperateurFormHandling = ({
  operateurId,
  nextRoute,
  callBack,
}: Props) => {
  const router = useRouter();

  const { updateOperateur } = useOperateur();

  const { mutate: saveOperateur } = useSaveMutation(
    "operateur-save",
    (data: Partial<OperateurUpdateFormValues>) =>
      updateOperateur({ id: operateurId, ...data })
  );

  const handleSubmit = async (data: Partial<OperateurUpdateFormValues>) => {
    const result = await saveOperateur(data);
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
  operateurId?: number;
  nextRoute?: string;
  callBack?: () => void;
};
