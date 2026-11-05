"use client";

import { RefObject, useEffect, useMemo, useState } from "react";

import { MessageApiRead } from "@/schemas/api/message.schema";
import {
  findSearchResultIds,
  parseSearchWords,
} from "@/utils/message-search.util";

export const useMessageSearch = ({
  messages,
  searchQuery,
  listRef,
}: {
  messages: MessageApiRead[] | null;
  searchQuery: string;
  listRef: RefObject<HTMLElement | null>;
}) => {
  const searchWords = useMemo(
    () => parseSearchWords(searchQuery),
    [searchQuery]
  );
  const resultIds = useMemo(
    () => findSearchResultIds(messages ?? [], searchWords),
    [messages, searchWords]
  );
  const [currentResultId, setCurrentResultId] = useState<number | null>(null);

  const currentIndex = resultIds.indexOf(currentResultId ?? -1);
  const nextResultId =
    currentIndex === -1 ? (resultIds[0] ?? null) : currentResultId;
  if (nextResultId !== currentResultId) {
    setCurrentResultId(nextResultId);
  }

  useEffect(() => {
    if (currentResultId !== null) {
      centerMessageInList(listRef.current, currentResultId);
    }
  }, [currentResultId, listRef]);

  const moveToResult = (step: number) => {
    if (resultIds.length === 0) {
      return;
    }
    const nextIndex =
      (currentIndex + step + resultIds.length) % resultIds.length;
    setCurrentResultId(resultIds[nextIndex]);
    centerMessageInList(listRef.current, resultIds[nextIndex]);
  };

  return {
    searchWords,
    resultCount: resultIds.length,
    resultPosition: currentIndex + 1,
    currentResultId,
    isResult: (messageId: number) => resultIds.includes(messageId),
    goToOlderResult: () => moveToResult(1),
    goToNewerResult: () => moveToResult(-1),
  };
};

// scrollIntoView ferait aussi défiler le tiroir, et sortirait la barre de recherche de l'écran
const centerMessageInList = (list: HTMLElement | null, messageId: number) => {
  const message = document.getElementById(`message-${messageId}`);
  if (!list || !message) {
    return;
  }
  const listBox = list.getBoundingClientRect();
  const messageBox = message.getBoundingClientRect();
  list.scrollTop +=
    messageBox.top - listBox.top - (listBox.height - messageBox.height) / 2;
};
