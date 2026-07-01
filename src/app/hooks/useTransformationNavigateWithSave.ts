import { useRouter } from "next/navigation";

import { useFetchState } from "@/app/context/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

import { useOptionalTransformationContext } from "../(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";

export const useTransformationNavigateWithSave = () => {
  const router = useRouter();
  const { saveCurrentForm, isSaverRegistered } =
    useOptionalTransformationContext();
  const { getFetchState } = useFetchState();

  const navigateWithSave = async (targetRoute: string) => {
    if (!isSaverRegistered) {
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
