import { z } from "zod";

export const faqApiWriteSchema = z.object({
  question: z.string().trim().min(1, { error: "La question est requise" }),
  contentMarkdown: z
    .string()
    .trim()
    .min(1, { error: "La réponse est requise" }),
  category: z.string().trim().min(1, { error: "La catégorie est requise" }),
});

export type FaqApiWrite = z.infer<typeof faqApiWriteSchema>;

export type FaqApiType = {
  id: number;
  question: string;
  contentMarkdown: string;
  category: string;
};
