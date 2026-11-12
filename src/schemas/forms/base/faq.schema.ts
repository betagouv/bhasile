import { z } from "zod";

import { faqApiWriteSchema } from "@/schemas/api/faq.schema";

export const faqFormSchema = faqApiWriteSchema;

export type FaqFormValues = z.infer<typeof faqFormSchema>;
