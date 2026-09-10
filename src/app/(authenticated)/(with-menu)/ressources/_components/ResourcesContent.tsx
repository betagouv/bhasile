"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { filterBlocks } from "@/app/utils/ressources.util";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { Block, FaqBlock } from "@/types/ressources.type";

import { ResourceBlock } from "./ResourceBlock";
import { ResourcesSearch } from "./ResourcesSearch";

export const ResourcesContent = ({
  blocks,
  suggestions,
  faqBlock,
  faqItems,
  hasFaqTabs,
}: Props): ReactElement => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  const filteredBlocks = filterBlocks(blocks, searchQuery);

  return (
    <>
      <ResourcesSearch suggestions={suggestions} />

      <div className="flex flex-col gap-3 max-w-7xl w-full mx-auto px-3 py-6">
        {filteredBlocks.map((blockItem) => (
          <ResourceBlock key={blockItem.id} block={blockItem} />
        ))}

        {hasFaqTabs && <ResourceBlock block={faqBlock} faqItems={faqItems} />}

        {filteredBlocks.length === 0 && !hasFaqTabs && (
          <p className="text-mention-grey text-center py-12 mb-0">
            {buildEmptyMessage(searchQuery)}
          </p>
        )}
      </div>
    </>
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
  suggestions: string[];
  faqBlock: FaqBlock;
  faqItems: FaqApiType[];
  hasFaqTabs: boolean;
};
