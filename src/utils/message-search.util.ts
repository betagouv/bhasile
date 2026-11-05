import {
  normalizeAccents,
  replaceSearchSeparators,
} from "@/app/utils/string.util";
import type { MessageApiRead } from "@/schemas/api/message.schema";

export const parseSearchWords = (searchQuery: string): string[] =>
  searchQuery
    .split(/\s+/)
    .map((word) => normalizeForSearch(word).normalizedText.trim())
    .filter((word) => word.length > 0);

// Du plus récent au plus ancien : le fil s'ouvre en bas, sur les derniers messages
export const findSearchResultIds = (
  messages: MessageApiRead[],
  searchWords: string[]
): number[] => {
  if (searchWords.length === 0) {
    return [];
  }
  return messages
    .filter((message) => doesMessageMatch(message, searchWords))
    .map((message) => message.id)
    .reverse();
};

export const splitTextBySearchWords = (
  text: string,
  searchWords: string[]
): TextSegment[] => {
  if (searchWords.length === 0) {
    return [{ text, isMatch: false }];
  }
  const ranges = findMatchRanges(text, searchWords);
  const segments: TextSegment[] = [];
  let position = 0;
  for (const { start, end } of ranges) {
    if (start > position) {
      segments.push({ text: text.slice(position, start), isMatch: false });
    }
    segments.push({ text: text.slice(start, end), isMatch: true });
    position = end;
  }
  if (position < text.length) {
    segments.push({ text: text.slice(position), isMatch: false });
  }
  return segments;
};

export type TextSegment = { text: string; isMatch: boolean };

const doesMessageMatch = (
  message: MessageApiRead,
  searchWords: string[]
): boolean => {
  const normalizedTexts = [
    message.text,
    ...message.attachments.map(({ originalName }) => originalName),
  ].map((text) => normalizeForSearch(text).normalizedText);
  return searchWords.every((word) =>
    normalizedTexts.some((text) => text.includes(word))
  );
};

const findMatchRanges = (text: string, searchWords: string[]): TextRange[] => {
  const { normalizedText, sourceRanges } = normalizeForSearch(text);
  const ranges: TextRange[] = [];
  for (const word of searchWords) {
    let matchIndex = normalizedText.indexOf(word);
    while (matchIndex !== -1) {
      ranges.push({
        start: sourceRanges[matchIndex].start,
        end: sourceRanges[matchIndex + word.length - 1].end,
      });
      matchIndex = normalizedText.indexOf(word, matchIndex + 1);
    }
  }
  return mergeRanges(ranges);
};

// La normalisation change les longueurs (« œ » donne « oe ») : chaque caractère normalisé garde sa position d'origine pour pouvoir surligner
const normalizeForSearch = (text: string): NormalizedText => {
  let normalizedText = "";
  const sourceRanges: TextRange[] = [];
  let position = 0;
  for (const character of text) {
    const end = position + character.length;
    const normalizedCharacter = replaceSearchSeparators(
      normalizeAccents(character)
    ).replace(/\s/, " ");
    if (normalizedCharacter === "" && sourceRanges.length > 0) {
      sourceRanges[sourceRanges.length - 1].end = end;
    }
    for (const part of normalizedCharacter) {
      if (part !== " " || !normalizedText.endsWith(" ")) {
        normalizedText += part;
        sourceRanges.push({ start: position, end });
      }
    }
    position = end;
  }
  return { normalizedText, sourceRanges };
};

const mergeRanges = (ranges: TextRange[]): TextRange[] => {
  const sortedRanges = [...ranges].sort(
    (first, second) => first.start - second.start
  );
  const mergedRanges: TextRange[] = [];
  for (const range of sortedRanges) {
    const lastRange = mergedRanges.at(-1);
    if (lastRange && range.start <= lastRange.end) {
      lastRange.end = Math.max(lastRange.end, range.end);
    } else {
      mergedRanges.push({ ...range });
    }
  }
  return mergedRanges;
};

type TextRange = { start: number; end: number };

type NormalizedText = { normalizedText: string; sourceRanges: TextRange[] };
