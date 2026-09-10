"use client";

import { ReactElement } from "react";

import { useFaq } from "@/app/hooks/useFaq";
import { Block, FaqBlock } from "@/types/ressources.type";

import { ResourceBlock } from "./ResourceBlock";

export const ResourcesBlockList = ({
  blocks,
  search = "",
}: Props): ReactElement => {
  const { faqItems } = useFaq();
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

  const hasFaqTabs = dynamicTabs.length > 0;

  return (
    <div className="flex flex-col gap-3 max-w-7xl w-full mx-auto px-3 py-6">
      {blocks.map((blockItem) => (
        <ResourceBlock key={blockItem.id} block={blockItem} />
      ))}

      {hasFaqTabs && <ResourceBlock block={faqBlock} />}

      {blocks.length === 0 && !hasFaqTabs && (
        <p className="text-mention-grey text-center py-12 mb-0">
          {buildEmptyMessage(search)}
        </p>
      )}
    </div>
  );
};

const buildEmptyMessage = (searchQuery: string): string => {
  if (searchQuery.trim().length === 0) {
    return "Aucun contenu publié pour le moment.";
  }
  return `Aucun résultat pour « ${searchQuery} ».`;
};

type Props = {
  blocks: Block[];
  search?: string;
};
