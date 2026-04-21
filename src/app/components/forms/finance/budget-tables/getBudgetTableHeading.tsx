import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

const isStructureInCpomForYear = (
  structure: StructureApiRead,
  year: number
): boolean =>
  structure.cpomStructures?.some((cpomStructure) => {
    const startYear = cpomStructure.dateStart
      ? new Date(cpomStructure.dateStart).getFullYear()
      : computeCpomDates(cpomStructure.cpom).dateStart
        ? new Date(computeCpomDates(cpomStructure.cpom).dateStart!).getFullYear()
        : undefined;
    const endYear = cpomStructure.dateEnd
      ? new Date(cpomStructure.dateEnd).getFullYear()
      : computeCpomDates(cpomStructure.cpom).dateEnd
        ? new Date(computeCpomDates(cpomStructure.cpom).dateEnd!).getFullYear()
        : undefined;

    return (
      startYear !== undefined &&
      endYear !== undefined &&
      startYear <= year &&
      endYear >= year
    );
  }) ?? false;

export const getBudgetTableHeading = ({ years, structure }: Props) => {
  return [
    <th className="bg-white" key="empty">
      {" "}
    </th>,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        className={cn("bg-white", !structure && "h-12")}
      >
        <span className={cn("block text-sm", structure && "mb-1")}>{year}</span>
        {structure && (
          <>
            {isStructureInCpomForYear(structure, year) ? (
              <Badge type="new" className="text-[10px]">
                En CPOM
              </Badge>
            ) : (
              <Badge type="disabled" className="text-[10px]">
                Hors CPOM
              </Badge>
            )}
          </>
        )}
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  structure?: StructureApiRead;
};
