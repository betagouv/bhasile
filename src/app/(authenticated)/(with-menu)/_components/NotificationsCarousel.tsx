"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { useCarousel } from "@/app/hooks/useCarousel";
import { cn } from "@/app/utils/classname.util";
import { DashboardNotification } from "@/types/dashboard.type";

export const NotificationsCarousel = ({
  notifications,
}: Props): ReactElement => {
  const {
    index,
    goToPrevious,
    goToNext,
    handleKeyDown,
    getSlideAnimationClassName,
    clearPreviousOnAnimationEnd,
  } = useCarousel(notifications.length);
  const hasMultiple = notifications.length > 1;

  return (
    <section
      className="flex flex-col gap-2 m-4"
      aria-roledescription="carrousel"
      aria-label="Notifications"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-mention-grey">
          Notifications
        </span>
        {hasMultiple && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-mention-grey">
              {index + 1} / {notifications.length}
            </span>
            <Button
              iconId="fr-icon-arrow-left-s-line"
              priority="tertiary no outline"
              size="small"
              title="Notification précédente"
              onClick={goToPrevious}
            />
            <Button
              iconId="fr-icon-arrow-right-s-line"
              priority="tertiary no outline"
              size="small"
              title="Notification suivante"
              onClick={goToNext}
            />
          </div>
        )}
      </div>

      <div
        role="group"
        aria-roledescription="diapositive"
        aria-live="polite"
        className="grid overflow-hidden"
      >
        {notifications.map((notification, slideIndex) => (
          <div
            key={notification.id}
            className={cn(
              "col-start-1 row-start-1 border-l-4 border-default-blue-france ml-8 pl-8 text-sm text-text-default-grey [&_a]:text-title-blue-france [&_a]:underline",
              getSlideAnimationClassName(slideIndex)
            )}
            aria-hidden={slideIndex !== index}
            onAnimationEnd={clearPreviousOnAnimationEnd(slideIndex)}
          >
            <div
              className="max-w-3xl"
              dangerouslySetInnerHTML={{ __html: notification.content }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

type Props = {
  notifications: DashboardNotification[];
};
