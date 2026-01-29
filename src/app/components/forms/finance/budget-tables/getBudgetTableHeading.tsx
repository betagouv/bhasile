import { Badge } from "@/app/components/common/Badge";
import { isStructureInCpom } from "@/app/utils/structure.util";
import { StructureApiType } from "@/schemas/api/structure.schema";

export const getBudgetTableHeading = ({ years, structure }: Props) => {
  return [
    " ",
    ...years.map((year) => (
      <th scope="col" key={year}>
        <span className="block mb-2">{year}</span>
<<<<<<< HEAD
        {structure && (
          <>
            {isStructureInCpom(structure, year) ? (
              <Badge type="new">En CPOM</Badge>
            ) : (
              <Badge type="disabled">Hors CPOM</Badge>
            )}
          </>
=======
        {isStructureInCpom(structure, year) ? (
          <Badge type="new">En CPOM</Badge>
        ) : (
          <Badge type="disabled">Hors CPOM</Badge>
>>>>>>> origin/migration
        )}
      </th>
    )),
  ];
};

type Props = {
  years: number[];
<<<<<<< HEAD
  structure?: StructureApiType;
=======
  structure: StructureApiType;
>>>>>>> origin/migration
};
