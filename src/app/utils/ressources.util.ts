import { normalizeWords } from "@/app/utils/string.util";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { Block, FaqBlock, FilesTab } from "@/types/ressources.type";

export const filterBlocks = (blocks: Block[], search: string): Block[] => {
  const words = normalizeWords(search).split(" ").filter(Boolean);

  if (words.length === 0) {
    return blocks;
  }

  return blocks
    .map((blockItem) => filterBlock(blockItem, words))
    .filter((blockItem) => blockItem.tabs.length > 0);
};

export const filterFaqItems = (
  faqItems: FaqApiType[],
  search: string
): FaqApiType[] => {
  const words = normalizeWords(search).split(" ").filter(Boolean);

  if (words.length === 0) {
    return faqItems;
  }

  return faqItems.filter((faqItem) => {
    const normalizedQuestion = normalizeWords(faqItem.question);
    const normalizedContent = normalizeWords(faqItem.contentMarkdown);
    const fullNormalizedText = `${normalizedQuestion} ${normalizedContent}`;

    return hasAllWords(fullNormalizedText, words);
  });
};

export const filterFaqBlock = (
  faqBlock: FaqBlock,
  filteredFaqItems: FaqApiType[]
): FaqBlock => {
  const availableCategories = new Set(
    filteredFaqItems.map((faqItem) => faqItem.category)
  );

  const filteredTabs = faqBlock.tabs.filter((tabItem) =>
    availableCategories.has(tabItem.title)
  );

  return {
    ...faqBlock,
    tabs: filteredTabs,
  };
};

export const countLinks = (tab: FilesTab): number =>
  tab.sections.reduce((total, section) => total + section.links.length, 0);

const hasAllWords = (searchText: string, words: string[]): boolean =>
  words.every((word) => searchText.includes(word));

const filterBlock = (block: Block, words: string[]): Block => {
  if (block.type === "fichiers") {
    const tabs = block.tabs
      .map((tab) => ({
        ...tab,
        sections: tab.sections
          .map((section) => ({
            ...section,
            links: section.links.filter((link) =>
              hasAllWords(link.searchText, words)
            ),
          }))
          .filter((section) => section.links.length > 0),
      }))
      .filter((tab) => countLinks(tab) > 0);

    return { ...block, tabs };
  }

  if (block.type === "faq") {
    return block;
  }

  const unreachable: never = block;
  throw new Error(`Type de bloc inconnu : ${JSON.stringify(unreachable)}`);
};
