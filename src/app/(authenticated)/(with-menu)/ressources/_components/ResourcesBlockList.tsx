import { connection } from "next/server";
import { ReactElement } from "react";

import { getFaqItems } from "@/app/api/faq/faq.service";
import { Block, FaqBlock } from "@/types/ressources.type";

import { ResourcesContent } from "./ResourcesContent";

export const ResourcesBlockList = async ({
  blocks,
  suggestions,
}: Props): Promise<ReactElement> => {
  await connection();
  const { faqItems } = await getFaqItems();
  const validFaqItems = Array.isArray(faqItems) ? faqItems : [];

  const uniqueCategories = Array.from(
    new Set(validFaqItems.map((faqItem) => faqItem.category))
  );

  const dynamicTabs = uniqueCategories.map((categoryName, categoryIndex) => ({
    id: `faq-tab-${categoryIndex}`,
    title: categoryName,
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

type Props = {
  blocks: Block[];
  suggestions: string[];
};
