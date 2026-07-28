import { normalizeForSearch } from "@/app/utils/string.util";
import { Block, FilesTab } from "@/types/ressources.type";

export const filterBlocks = (blocks: Block[], search: string): Block[] => {
  const words = normalizeForSearch(search).split(" ").filter(Boolean);

  if (words.length === 0) {
    return blocks;
  }

  return blocks
    .map((block) => filterBlock(block, words))
    .filter((block) => block.tabs.length > 0);
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
    const tabs = block.tabs
      .map((tab) => ({
        ...tab,
        questions: tab.questions.filter((question) =>
          hasAllWords(question.searchText, words)
        ),
      }))
      .filter((tab) => tab.questions.length > 0);

    return { ...block, tabs };
  }

  const unreachable: never = block;
  throw new Error(`Type de bloc inconnu : ${JSON.stringify(unreachable)}`);
};
