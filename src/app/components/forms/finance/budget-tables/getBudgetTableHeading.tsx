import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import { isStructureInCpom } from "@/app/utils/structure.util";
import { StructureApiType } from "@/schemas/api/structure.schema";

export const getBudgetTableHeading = ({ years, structure }: Props) => {
  return [
    <th className="bg-white" key="empty">
      {" "}
    </th>,
    ...years.map((year) => (
      <th scope="col" key={year} className="bg-white">
        <span className={cn("block", structure && "mb-2")}>{year}</span>
        {structure && (
          <>
            {isStructureInCpom(structure, year) ? (
              <Badge type="new">En CPOM</Badge>
            ) : (
              <Badge type="disabled">Hors CPOM</Badge>
            )}
          </>
        )}
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  structure?: StructureApiType;
};
