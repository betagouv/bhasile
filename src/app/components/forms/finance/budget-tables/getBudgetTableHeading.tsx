import { cn } from "@/app/utils/classname.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import { CpomYearBadge } from "./CpomYearBadge";

export const getBudgetTableHeading = ({ years, structure }: Props) => {
  return [
    <th className="bg-white" key="empty">
      {" "}
    </th>,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        data-year={year}
        className={cn("bg-white", !structure && "h-12")}
      >
        <span className={cn("block text-sm", structure && "mb-1")}>{year}</span>
        {structure && (
          <CpomYearBadge isInCpom={structure.isInCpomPerYear[year]} />
        )}
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  structure?: StructureApiRead;
};
