"use client";

import { useCallback, useEffect, useState } from "react";

const POLLING_INTERVAL_MS = 60_000;

// Relu dès le montage : au retour arrière, Next réaffiche la page en cache avec sa pastille d'origine
export const useNotificationCount = () => {
  const [count, setCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCount((current) => current + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    let isFetching = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const fetchCount = async () => {
      try {
        const response = await fetch("/api/notifications/count");
        if (response.ok && isActive) {
          const body: { count: number } = await response.json();
          setCount(body.count);
        }
      } catch {
        // la pastille garde sa dernière valeur
      }
    };

    const poll = async () => {
      if (document.visibilityState === "visible") {
        isFetching = true;
        await fetchCount();
        isFetching = false;
      }
      if (isActive) {
        timeout = setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isFetching) {
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
  }, [refreshCount]);

  return { count, refresh };
};
