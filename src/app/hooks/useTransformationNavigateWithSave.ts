import { useRouter } from "next/navigation";

import { useFetchState } from "@/contexts/FetchStateContext";
import { useOptionalTransformationContext } from "@/contexts/TransformationContext";
import { FetchState } from "@/types/fetch-state.type";

export const useTransformationNavigateWithSave = () => {
  const router = useRouter();
  const { saveCurrentForm } = useOptionalTransformationContext();
  const { getFetchState } = useFetchState();

  const navigateWithSave = async (targetRoute: string) => {
    if (!saveCurrentForm) {
      router.push(targetRoute);
      return;
    }

    if (getFetchState("transformation-save") === FetchState.LOADING) {
      return;
    }

    try {
      const saved = await saveCurrentForm();
      if (saved) {
        router.push(targetRoute);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { navigateWithSave };
};
