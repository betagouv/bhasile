import { ReactElement } from "react";

import {
  ACTIVE_TRAILING_COLUMNS,
  SHARED_COLUMNS,
} from "./_components/StructuresTable";

export const StructuresSkeleton = (): ReactElement => (
  <div
    className="px-4 motion-safe:animate-pulse"
    role="status"
    aria-busy="true"
  >
    <span className="sr-only">Chargement des structures...</span>
    {[...Array(VISIBLE_ROW_COUNT).keys()].map((index) => (
      <div
        key={index}
        className="border-t border-default-grey h-12 flex items-center gap-4"
      >
        {[...Array(COLUMN_COUNT).keys()].map((column) => (
          <div key={column} className="h-4 flex-1 rounded bg-contrast-grey" />
        ))}
      </div>
    ))}
  </div>
);

const VISIBLE_ROW_COUNT = 12;

const COLUMN_COUNT = SHARED_COLUMNS.length + ACTIVE_TRAILING_COLUMNS.length + 1;
