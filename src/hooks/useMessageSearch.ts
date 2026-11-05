"use client";

import { useEffect, useMemo, useState } from "react";

import { MessageApiRead } from "@/schemas/api/message.schema";
import {
  findSearchResultIds,
  parseSearchWords,
} from "@/utils/message-search.util";

export const useMessageSearch = (
  messages: MessageApiRead[] | null,
  searchQuery: string
) => {
  const searchWords = useMemo(
    () => parseSearchWords(searchQuery),
    [searchQuery]
  );
  const resultIds = useMemo(
    () => findSearchResultIds(messages ?? [], searchWords),
    [messages, searchWords]
  );
  const [currentResultId, setCurrentResultId] = useState<number | null>(null);

  const isCurrentResultKept =
    currentResultId !== null && resultIds.includes(currentResultId);
  const nextResultId = isCurrentResultKept
    ? currentResultId
    : (resultIds[0] ?? null);
  if (nextResultId !== currentResultId) {
    setCurrentResultId(nextResultId);
  }

  useEffect(() => {
    if (currentResultId !== null) {
      document
        .getElementById(`message-${currentResultId}`)
        ?.scrollIntoView({ block: "center" });
    }
  }, [currentResultId]);

  const moveToResult = (step: number) => {
    if (resultIds.length === 0) {
      return;
    }
    const currentIndex = resultIds.indexOf(currentResultId ?? -1);
    const nextIndex =
      (currentIndex + step + resultIds.length) % resultIds.length;
    setCurrentResultId(resultIds[nextIndex]);
  };

  return {
    searchWords,
    resultCount: resultIds.length,
    resultPosition:
      currentResultId === null ? 0 : resultIds.indexOf(currentResultId) + 1,
    currentResultId,
    goToOlderResult: () => moveToResult(1),
    goToNewerResult: () => moveToResult(-1),
  };
};
