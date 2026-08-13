import { ReactElement } from "react";

const VISIBLE_ROW_COUNT = 6;

export const OperateursSkeleton = (): ReactElement => (
  <div className="motion-safe:animate-pulse" role="status" aria-busy="true">
    <span className="sr-only">Chargement des opérateurs...</span>
    {[...Array(VISIBLE_ROW_COUNT).keys()].map((index) => (
      <div key={index} className="px-3 pt-3">
        <div className="h-28 border border-default-grey rounded-[10px] bg-white">
          <div className="flex h-full px-6 py-4 justify-between items-center">
            <div className="flex items-center">
              <div className="size-20 mr-10 rounded bg-contrast-grey" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-48 rounded bg-contrast-grey" />
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded bg-contrast-grey" />
                  <div className="h-4 w-16 rounded bg-contrast-grey" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="h-10 w-16 rounded bg-contrast-grey" />
              <div className="h-10 w-16 rounded bg-contrast-grey" />
              <div className="h-10 w-16 rounded bg-contrast-grey" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
