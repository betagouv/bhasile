"use client";

import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FaqCategoryApiUpdate } from "@/schemas/api/faq.schema";
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

  const { mutate: renameFaqCategory } = useSaveMutation(
    FAQ_SAVE_KEY,
    (rename: FaqCategoryApiUpdate) =>
      sendFaqRequest("/api/faq/categories", "PUT", rename)
  );

  return {
    saveFaqItem,
    deleteFaqItem,
    renameFaqCategory,
    isSaving: getFetchState(FAQ_SAVE_KEY) === FetchState.LOADING,
  };
};

const sendFaqRequest = async (
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: FaqFormValues | FaqCategoryApiUpdate
): Promise<void> => {
  const response = await fetch(
    url,
    body
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { method }
  );
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
};
