import { ReactElement, ReactNode } from "react";

import { Filters } from "@/app/components/filters/Filters";
import { SearchBar } from "@/app/components/SearchBar";
import { cn } from "@/app/utils/classname.util";
import { Visualization } from "@/types/structure-list.type";

import { StatutTabs } from "./StatutTabs";

export const Toolbar = ({ variant, count }: Props): ReactElement => (
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
      {count}
    </div>
  </div>
);

type Props = {
  variant: Visualization;
  count: ReactNode;
};
