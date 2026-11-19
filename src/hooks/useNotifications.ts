"use client";

import { useCallback, useRef, useState } from "react";

import type {
  NotificationApiRead,
  NotificationSeenApiUpdateClient,
} from "@/schemas/api/notification.schema";

export const useNotifications = () => {
  const loadRequestRef = useRef(0);
  const [items, setItems] = useState<NotificationApiRead[] | null>(null);
  const [hasLoadingError, setHasLoadingError] = useState(false);

  const load = async (): Promise<void> => {
    const requestId = ++loadRequestRef.current;
    setItems(null);
    setHasLoadingError(false);
    const loadedItems = await fetchNotifications();
    // Chargement annulé entre-temps : ces lignes n'ont pas été affichées
    if (requestId !== loadRequestRef.current) {
      return;
    }
    if (!loadedItems) {
      setHasLoadingError(true);
      return;
    }
    setItems(loadedItems);
    const [latestItem] = loadedItems;
    if (latestItem) {
      await markSeen({ seenUntil: latestItem.occurredAt });
    }
  };

  const cancelLoad = useCallback((): void => {
    loadRequestRef.current += 1;
  }, []);

  const read = (item: NotificationApiRead): void => {
    setItems((current) =>
      current ? current.filter(({ key }) => key !== item.key) : current
    );
    if (item.eventId !== null) {
      fetch("/api/notifications/reads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: item.eventId }),
        keepalive: true,
      }).catch(() => undefined);
    }
  };

  return { items, hasLoadingError, load, cancelLoad, read };
};

const fetchNotifications = async (): Promise<NotificationApiRead[] | null> => {
  try {
    const response = await fetch("/api/notifications");
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};

// Un échec laisse le repère en place : la pastille garde ces lignes
const markSeen = async (
  body: NotificationSeenApiUpdateClient
): Promise<void> => {
  await fetch("/api/notifications/seen", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
};
