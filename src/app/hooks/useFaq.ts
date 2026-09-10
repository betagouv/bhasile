import { useEffect, useState } from "react";

import { FaqApiType } from "@/schemas/api/faq.schema";

import { ApiError, extractApiError } from "../utils/apiError.util";

export const useFaq = () => {
  const [faqItems, setFaqItems] = useState<FaqApiType>();

  useEffect(() => {
    const fetchFaqItems = async () => {
      const response = await fetch("/api/faq");
      if (!response.ok) {
        throw new ApiError(await extractApiError(response), response.status);
      }
      const result = await response.json();
      setFaqItems(result.faqItems);
    };
    fetchFaqItems();
  }, []);

  return {
    faqItems,
  };
};
