"use client";

import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FaqFormValues } from "@/schemas/forms/base/faq.schema";
import { FetchState } from "@/types/fetch-state.type";

const FAQ_SAVE_KEY = "faq-save";

export const useFaqItemMutations = () => {
  const { getFetchState } = useFetchState();

  const { mutate: saveFaqItem } = useSaveMutation(
    FAQ_SAVE_KEY,
    (id: number | null, faqItem: FaqFormValues) =>
      id === null
        ? sendFaqRequest("/api/faq", "POST", faqItem)
        : sendFaqRequest(`/api/faq/${id}`, "PUT", faqItem)
  );

  const { mutate: deleteFaqItem } = useSaveMutation(
    FAQ_SAVE_KEY,
    (id: number) => sendFaqRequest(`/api/faq/${id}`, "DELETE")
  );

  return {
    saveFaqItem,
    deleteFaqItem,
    isSaving: getFetchState(FAQ_SAVE_KEY) === FetchState.LOADING,
  };
};

const sendFaqRequest = async (
  url: string,
  method: "POST" | "PUT" | "DELETE",
  faqItem?: FaqFormValues
): Promise<void> => {
  const response = await fetch(
    url,
    faqItem
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(faqItem),
        }
      : { method }
  );
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
};
