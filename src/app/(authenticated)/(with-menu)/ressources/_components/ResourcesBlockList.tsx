import { connection } from "next/server";
import { ReactElement } from "react";

import { getFaqItems } from "@/app/api/faq/faq.service";
import { FaqBlock } from "@/types/ressources.type";
import { groupFaqItemsByCategory } from "@/utils/faq.util";
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

  const dynamicTabs = groupFaqItemsByCategory(validFaqItems).map(
    ({ category, items }, categoryIndex) => ({
      id: `faq-tab-${categoryIndex}`,
      title: category,
      items,
    })
  );

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
