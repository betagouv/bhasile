import { ReactElement } from "react";

import { Filters } from "@/app/components/filters/Filters";
import { SearchBar } from "@/app/components/SearchBar";
import { cn } from "@/app/utils/classname.util";
import { formatPlural } from "@/app/utils/string.util";

import { StatutTabs } from "./StatutTabs";

type Visualization = "tableau" | "carte";

export const Toolbar = ({ variant, totalStructures }: Props): ReactElement => (
  <div
    className={cn(
      "flex gap-2 items-center py-3.5 px-6",
      variant === "carte" ? "bg-white/80" : ""
    )}
  >
    <StatutTabs />
    <div className="flex gap-2 items-center ml-auto">
      <SearchBar placeholder="Code ou commune" inputId="structures-search" />
      <Filters />
      <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
        {formatPlural(totalStructures, "entrée")}
      </p>
    </div>
  </div>
);

type Props = {
  variant: Visualization;
  totalStructures: number | undefined;
};
