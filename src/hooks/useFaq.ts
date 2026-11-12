import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { FaqCategoryApiUpdate } from "@/schemas/api/faq.schema";
import { FaqFormValues } from "@/schemas/forms/base/faq.schema";

const sendFaqRequest = async (
  url: string,
  method: "POST" | "PUT" | "DELETE",
  data?: FaqFormValues | FaqCategoryApiUpdate
): Promise<void> => {
  const response = await fetch(url, {
    method,
    body: data && JSON.stringify(data),
  });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
};

export const useFaq = () => {
  const addFaqItem = (faqItem: FaqFormValues): Promise<void> =>
    sendFaqRequest("/api/faq", "POST", faqItem);

  const updateFaqItem = (id: number, faqItem: FaqFormValues): Promise<void> =>
    sendFaqRequest(`/api/faq/${id}`, "PUT", faqItem);

  const deleteFaqItem = (id: number): Promise<void> =>
    sendFaqRequest(`/api/faq/${id}`, "DELETE");

  const renameFaqCategory = (rename: FaqCategoryApiUpdate): Promise<void> =>
    sendFaqRequest("/api/faq/categories", "PUT", rename);

  return { addFaqItem, updateFaqItem, deleteFaqItem, renameFaqCategory };
};
