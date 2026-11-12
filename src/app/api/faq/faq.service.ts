import { FaqApiType, FaqApiWrite } from "@/schemas/api/faq.schema";

import {
  createFaqItem,
  deleteFaqItem,
  findFaqItem,
  findFaqItems,
  updateFaqItem,
} from "./faq.repository";
import { faqItemNotFound } from "./faq.util";

export const getFaqItems = async (): Promise<{
  faqItems: FaqApiType[];
}> => {
  const { faqItems } = await findFaqItems();

  return {
    faqItems,
  };
};

export const addFaqItem = async (input: FaqApiWrite): Promise<void> => {
  await createFaqItem(input);
};

export const editFaqItem = async (
  id: number,
  input: FaqApiWrite
): Promise<void> => {
  await assertFaqItemExists(id);
  await updateFaqItem(id, input);
};

export const removeFaqItem = async (id: number): Promise<void> => {
  await assertFaqItemExists(id);
  await deleteFaqItem(id);
};

const assertFaqItemExists = async (id: number): Promise<void> => {
  if (!(await findFaqItem(id))) {
    throw faqItemNotFound();
  }
};
