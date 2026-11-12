import { z } from "zod";

const faqCategorySchema = z
  .string()
  .trim()
  .min(1, { error: "La catégorie est requise" });

export const faqApiWriteSchema = z.object({
  question: z.string().trim().min(1, { error: "La question est requise" }),
  contentMarkdown: z
    .string()
    .trim()
    .min(1, { error: "La réponse est requise" }),
  category: faqCategorySchema,
});

export type FaqApiWrite = z.infer<typeof faqApiWriteSchema>;

export const faqCategoryApiUpdateSchema = z.object({
  category: z.string(),
  newCategory: faqCategorySchema,
});

export type FaqCategoryApiUpdate = z.infer<typeof faqCategoryApiUpdateSchema>;

export type FaqApiType = {
  id: number;
  question: string;
  contentMarkdown: string;
  category: string;
};
