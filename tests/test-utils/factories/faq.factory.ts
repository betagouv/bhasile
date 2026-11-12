import { FaqApiType, FaqApiWrite } from "@/schemas/api/faq.schema";

export const createFaqItemValues = (
  overrides: Partial<FaqApiWrite> = {}
): FaqApiWrite => ({
  question: "Comment déclarer une fermeture ?",
  contentMarkdown: "Depuis la fiche structure.",
  category: "Structures",
  ...overrides,
});

export const createFaqApiItem = (
  overrides: Partial<FaqApiType> = {}
): FaqApiType => ({
  id: 1,
  ...createFaqItemValues(),
  ...overrides,
});
