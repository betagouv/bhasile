import { ReactElement } from "react";

import { Filters } from "@/app/components/filters/Filters";
import { SearchBar } from "@/app/components/SearchBar";
import { cn } from "@/app/utils/classname.util";

type Visualization = "tableau" | "carte";

export const Toolbar = ({
  variant,
  totalStructures,
}: {
  variant: Visualization;
  totalStructures: number | undefined;
}): ReactElement => (
  <div className="flex gap-2 justify-end items-center py-3.5 px-6">
    <SearchBar placeholder="Code ou commune" inputId="structures-search" />
    <Filters />
    <p
      className={cn(
        "pl-3 text-mention-grey mb-0 min-w-24 text-right",
        variant === "carte" && "bg-lifted-grey/90 rounded px-2 py-1"
      )}
    >
      {totalStructures ?? 0} entrée
      {(totalStructures ?? 0) > 1 ? "s" : ""}
    </p>
  </div>
);
