import { FaqApiType } from "@/schemas/api/faq.schema";

import { findFaqItems } from "./faq.repository";

export const getFaqItems = async (): Promise<{
  faqItems: FaqApiType[];
}> => {
  const { faqItems } = await findFaqItems();

  return {
    faqItems,
  };
};
