import MarkdownIt from "markdown-it";

import { FaqApiType } from "@/schemas/api/faq.schema";

const markdownParser = new MarkdownIt({ html: false });

export const renderFaqMarkdown = (markdown: string): string =>
  markdownParser.render(markdown);

export const groupFaqItemsByCategory = (
  faqItems: FaqApiType[]
): FaqCategoryGroup[] =>
  [...new Set(faqItems.map((faqItem) => faqItem.category))]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((category) => ({
      category,
      items: faqItems.filter((faqItem) => faqItem.category === category),
    }));

type FaqCategoryGroup = {
  category: string;
  items: FaqApiType[];
};
