import { ReactElement } from "react";

import { STRUCTURES_COLUMN_COUNT } from "./_components/structuresColumns";

export const StructuresSkeleton = (): ReactElement => (
  <div
    className="px-4 motion-safe:animate-pulse"
    role="status"
    aria-busy="true"
  >
    <div className="border border-default-grey rounded px-4">
      <span className="sr-only">Chargement des structures...</span>
      {[...Array(VISIBLE_ROW_COUNT).keys()].map((index) => (
        <div
          key={index}
          className="border-b border-default-grey h-12 flex items-center gap-4"
        >
          {[...Array(STRUCTURES_COLUMN_COUNT).keys()].map((column) => (
            <div key={column} className="h-4 flex-1 rounded bg-contrast-grey" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const VISIBLE_ROW_COUNT = 12;
