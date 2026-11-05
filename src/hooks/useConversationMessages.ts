"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, extractApiError } from "@/app/utils/api-error.util";
import { MessageApiRead } from "@/schemas/api/message.schema";
import { ConversationVisibility } from "@/types/conversation.type";

const POLLING_INTERVAL_MS = 10_000;
const ACCESS_LOST_STATUSES = [401, 403];

export const useConversationMessages = ({
  structureId,
  year,
  visibility,
}: {
  structureId: number;
  year: number;
  visibility: ConversationVisibility;
}) => {
  const messagesUrl = `/api/tarifications/${structureId}/${year}/messages`;
  const [messages, setMessages] = useState<MessageApiRead[] | null>(null);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [hasLostAccess, setHasLostAccess] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    let isFetching = false;
    let isPollingStopped = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${messagesUrl}?visibility=${visibility}`);
        if (ACCESS_LOST_STATUSES.includes(response.status)) {
          isPollingStopped = true;
          if (isActive) {
            setHasLostAccess(true);
          }
          return;
        }
        if (!response.ok) {
          throw new ApiError(await extractApiError(response), response.status);
        }
        const fetchedMessages: MessageApiRead[] = await response.json();
        if (isActive) {
          setMessages(fetchedMessages);
          setHasLoadingError(false);
        }
      } catch {
        if (isActive) {
          setHasLoadingError(true);
        }
      }
    };

    const poll = async () => {
      if (document.visibilityState === "visible") {
        isFetching = true;
        await fetchMessages();
        isFetching = false;
      }
      if (isActive && !isPollingStopped) {
        timeout = setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !isFetching &&
        !isPollingStopped
      ) {
        clearTimeout(timeout);
        poll();
      }
    };

    poll();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isActive = false;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [messagesUrl, visibility, refreshCount]);

  const postMessage = useCallback(
    async ({
      text,
      fileKeys,
      tagKey,
    }: {
      text: string;
      fileKeys: string[];
      tagKey: string | null;
    }): Promise<void> => {
      const response = await fetch(messagesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, text, fileKeys, tagKey }),
      });
      if (!response.ok) {
        throw new ApiError(await extractApiError(response), response.status);
      }
      refresh();
    },
    [messagesUrl, visibility, refresh]
  );

  const markAsRead = useCallback(
    async (messageIds: number[]): Promise<void> => {
      const response = await fetch(`${messagesUrl}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, messageIds }),
      });
      if (!response.ok) {
        throw new ApiError(await extractApiError(response), response.status);
      }
      refresh();
    },
    [messagesUrl, visibility, refresh]
  );

  const changeTag = useCallback(
    async (messageId: number, tagKey: string | null): Promise<void> => {
      setMessages(
        (current) =>
          current?.map((message) =>
            message.id === messageId ? { ...message, tagKey } : message
          ) ?? null
      );
      try {
        const response = await fetch(
          `/api/tarifications/messages/${messageId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagKey }),
          }
        );
        if (!response.ok) {
          throw new ApiError(await extractApiError(response), response.status);
        }
      } finally {
        refresh();
      }
    },
    [refresh]
  );

  return {
    messages,
    hasLoadingError,
    hasLostAccess,
    postMessage,
    markAsRead,
    changeTag,
  };
};
