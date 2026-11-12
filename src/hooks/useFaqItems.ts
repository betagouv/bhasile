"use client";

import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FaqApiWrite } from "@/schemas/api/faq.schema";
import { FetchState } from "@/types/fetch-state.type";

const FAQ_SAVE_KEY = "faq-save";

export const useFaqItems = () => {
  const { getFetchState } = useFetchState();

  const { mutate: saveFaqItem } = useSaveMutation(
    FAQ_SAVE_KEY,
    (id: number | null, faqItem: FaqApiWrite) =>
      sendFaqRequest(
        id === null ? "/api/faq" : `/api/faq/${id}`,
        id === null ? "POST" : "PUT",
        faqItem
      )
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
  faqItem?: FaqApiWrite
): Promise<true> => {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: faqItem ? JSON.stringify(faqItem) : undefined,
  });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
  return true;
};
