"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { KeyboardEvent, ReactElement, useState } from "react";

import { cn } from "@/app/utils/classname.util";
import { DashboardNotification } from "@/types/dashboard.type";

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const NotificationsCarousel = ({
  notifications,
}: Props): ReactElement => {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const hasMultiple = notifications.length > 1;

  const goTo = (nextIndex: number, nextDirection: "next" | "prev"): void => {
    if (prefersReducedMotion()) {
      setPreviousIndex(null);
      setIndex(nextIndex);
      return;
    }
    setDirection(nextDirection);
    setPreviousIndex(index);
    setIndex(nextIndex);
  };

  const goToPrevious = (): void =>
    goTo((index - 1 + notifications.length) % notifications.length, "prev");
  const goToNext = (): void => goTo((index + 1) % notifications.length, "next");

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const getSlideAnimationClassName = (slideIndex: number): string => {
    if (slideIndex === index) {
      return direction === "next"
        ? "animate-slide-in-right"
        : "animate-slide-in-left";
    }
    if (slideIndex === previousIndex) {
      return direction === "next"
        ? "animate-slide-out-left"
        : "animate-slide-out-right";
    }
    return "invisible";
  };

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
              "col-start-1 row-start-1 border-l-4 border-default-blue-france ml-8 pl-8 max-w-3xl text-sm text-text-default-grey [&_a]:text-title-blue-france [&_a]:underline ",
              getSlideAnimationClassName(slideIndex)
            )}
            aria-hidden={slideIndex !== index}
            onAnimationEnd={
              slideIndex === previousIndex
                ? () => setPreviousIndex(null)
                : undefined
            }
            dangerouslySetInnerHTML={{ __html: notification.content }}
          />
        ))}
      </div>
    </section>
  );
};

type Props = {
  notifications: DashboardNotification[];
};
