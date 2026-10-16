import { connection } from "next/server";
import { ReactElement } from "react";

import { getFaqItems } from "@/app/api/faq/faq.service";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { FaqBlock } from "@/types/ressources.type";
import {
  readBlocks,
  readSuggestions,
} from "@/utils-server/ressources.server.util";

import { ResourcesContent } from "./ResourcesContent";

export const ResourcesBlockList = async (): Promise<ReactElement> => {
  await connection();
  const blocks = await readBlocks();
  const suggestions = await readSuggestions();
  const { faqItems } = await getFaqItems();
  const validFaqItems = Array.isArray(faqItems) ? faqItems : [];

  const uniqueCategories = Array.from(
    new Set(validFaqItems.map((faqItem: FaqApiType) => faqItem.category))
  );

  const dynamicTabs = uniqueCategories.map((categoryName, categoryIndex) => ({
    id: `faq-tab-${categoryIndex}`,
    title: categoryName,
    items: validFaqItems.filter(
      (faqItem: FaqApiType) => faqItem.category === categoryName
    ),
  }));

  const faqBlock: FaqBlock = {
    type: "faq",
    id: "faq",
    title: "FAQ",
    icon: "fr-icon-question-answer-line",
    tabs: dynamicTabs,
  };

  return (
    <ResourcesContent
      blocks={blocks}
      suggestions={suggestions}
      faqBlock={faqBlock}
      faqItems={validFaqItems}
      hasFaqTabs={dynamicTabs.length > 0}
    />
  );
};
