import { DomainError } from "@/app/utils/domain-error.util";
import {
  FaqApiType,
  FaqApiWrite,
  FaqCategoryApiUpdate,
} from "@/schemas/api/faq.schema";

import {
  createFaqItem,
  deleteFaqItem,
  findFaqItem,
  findFaqItems,
  updateFaqCategory,
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

export const renameFaqCategory = async ({
  category,
  newCategory,
}: FaqCategoryApiUpdate): Promise<void> => {
  const { count } = await updateFaqCategory(category, newCategory);
  if (count === 0) {
    throw new DomainError("Catégorie introuvable", 404);
  }
};

const assertFaqItemExists = async (id: number): Promise<void> => {
  if (!(await findFaqItem(id))) {
    throw faqItemNotFound();
  }
};
