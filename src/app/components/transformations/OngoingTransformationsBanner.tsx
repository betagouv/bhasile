"use client";

import { ReactElement, useState } from "react";

import { useOngoingTransformations } from "@/app/hooks/useOngoingTransformations";
import { cn } from "@/app/utils/classname.util";

import { OngoingTransformation } from "./OngoingTransformation";

export const OngoingTransformationsBanner = (): ReactElement | null => {
  const { transformations } = useOngoingTransformations();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (transformations.length === 0) {
    return null;
  }

  return (
    <section className="px-6 pt-4">
      <div className="rounded overflow-hidden border border-default-grey">
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
          className="flex items-center justify-between w-full px-4 py-3 bg-alt-blue-france text-left"
        >
          <span className="text-title-blue-france text-sm">
            Saisies de créations, transformations et fermetures en cours
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-(--background-action-high-blue-france) text-white text-sm font-bold">
              {transformations.length}
            </span>
            <i
              className={cn(
                "text-title-blue-france",
                isExpanded
                  ? "fr-icon-arrow-up-s-line"
                  : "fr-icon-arrow-down-s-line"
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {isExpanded && (
          <ul className="bg-white grid grid-cols-[repeat(5,minmax(max-content,1fr))_auto] gap-x-4 px-4">
            {transformations.map((transformation) => (
              <OngoingTransformation
                key={transformation.id}
                transformation={transformation}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
