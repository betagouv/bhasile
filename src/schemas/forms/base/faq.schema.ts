import { z } from "zod";

import {
  faqApiWriteSchema,
  faqCategoryApiUpdateSchema,
} from "@/schemas/api/faq.schema";

export const faqFormSchema = faqApiWriteSchema;

export type FaqFormValues = z.infer<typeof faqFormSchema>;

export const faqCategoryFormSchema = faqCategoryApiUpdateSchema.pick({
  newCategory: true,
});

export type FaqCategoryFormValues = z.infer<typeof faqCategoryFormSchema>;
