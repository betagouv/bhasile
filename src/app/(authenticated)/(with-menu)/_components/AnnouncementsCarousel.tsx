"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { useCarousel } from "@/app/hooks/useCarousel";
import { cn } from "@/app/utils/classname.util";
import { DashboardAnnouncement } from "@/types/dashboard.type";

export const AnnouncementsCarousel = ({
  announcements,
}: Props): ReactElement => {
  const {
    index,
    goToPrevious,
    goToNext,
    handleKeyDown,
    getSlideAnimationClassName,
  } = useCarousel(announcements.length);
  const hasMultiple = announcements.length > 1;

  return (
    <section
      className="flex flex-col gap-2 m-4"
      aria-roledescription="carrousel"
      aria-label="Annonces"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-mention-grey">
          Annonces
        </span>
        {hasMultiple && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-mention-grey">
              {index + 1} / {announcements.length}
            </span>
            <Button
              iconId="fr-icon-arrow-left-s-line"
              priority="tertiary no outline"
              size="small"
              title="Annonce précédente"
              onClick={goToPrevious}
            />
            <Button
              iconId="fr-icon-arrow-right-s-line"
              priority="tertiary no outline"
              size="small"
              title="Annonce suivante"
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
        {announcements.map((announcement, slideIndex) => (
          <div
            key={announcement.id}
            className={cn(
              "col-start-1 row-start-1 border-l-4 border-default-blue-france ml-8 pl-8 text-sm text-text-default-grey",
              getSlideAnimationClassName(slideIndex)
            )}
            aria-hidden={slideIndex !== index}
          >
            <p className="max-w-3xl">{announcement.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

type Props = {
  announcements: DashboardAnnouncement[];
};
