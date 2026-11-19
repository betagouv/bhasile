"use client";

import { ReactElement, useCallback, useEffect, useRef } from "react";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { cn } from "@/app/utils/classname.util";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useNotifications } from "@/hooks/useNotifications";

import { NotificationPanel } from "./NotificationPanel";

export const NotificationBell = (): ReactElement => {
  const { count, refresh } = useNotificationCount();
  const { items, hasLoadingError, load, cancelLoad, read } = useNotifications();
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openPanel = async (): Promise<void> => {
    setIsPanelOpen(true);
    await load();
    refresh();
  };

  const closePanel = useCallback((): void => {
    setIsPanelOpen(false);
    buttonRef.current?.focus();
  }, [setIsPanelOpen]);

  // Échap écouté sur le document : Safari ne donne pas le focus au bouton cliqué. Le défilement cache l'en-tête,
  // et le panneau avec lui
  useEffect(() => {
    if (!isPanelOpen) {
      cancelLoad();
      return;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closePanel();
      }
    };
    const handleScroll = (): void => setIsPanelOpen(false);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isPanelOpen, closePanel, setIsPanelOpen, cancelLoad]);

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isPanelOpen}
        aria-controls={PANEL_ID}
        aria-label={getButtonLabel(count)}
        title="Notifications"
        onClick={isPanelOpen ? closePanel : openPanel}
        className="fr-btn fr-btn--tertiary-no-outline fr-icon-notification-3-line relative"
      >
        {count > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0 right-0 inline-flex items-center justify-center min-w-5 h-5 px-1",
              "rounded-full bg-action-high-error text-white text-xs font-bold"
            )}
          >
            {count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}
          </span>
        )}
      </button>
      {isPanelOpen && (
        <NotificationPanel
          id={PANEL_ID}
          items={items}
          hasLoadingError={hasLoadingError}
          onRead={read}
        />
      )}
    </div>
  );
};

const PANEL_ID = "notification-panel";
const MAX_DISPLAYED_COUNT = 99;

const getButtonLabel = (count: number): string => {
  if (count === 0) {
    return "Notifications";
  }
  return count === 1
    ? "Notifications, 1 nouvelle"
    : `Notifications, ${count} nouvelles`;
};
