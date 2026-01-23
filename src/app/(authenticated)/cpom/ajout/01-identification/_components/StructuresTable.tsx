import { useFormContext } from "react-hook-form";

import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const StructuresTable = ({ structures }: Props) => {
  const { watch } = useFormContext();

  const { years } = getYearRange({ order: "desc" });

  if (!structures) {
    return null;
  }

  const selectedStructuresDnaCodes = watch("structures") as string[];

  const selectedStructures = structures?.filter((structure) =>
    selectedStructuresDnaCodes.includes(structure.dnaCode)
  );

  return (
    <Table
      headings={["DNA", ...years.map((year) => year.toString())]}
      ariaLabelledBy="structures-table"
    >
      {selectedStructures?.map((structure) => (
        <tr key={structure.dnaCode}>
          <td>{structure.dnaCode}</td>
          {years.map((year) => (
            <td key={year}>
        </tr>
      ))}
    </Table>
  );
};

type Props = {
  structures?: StructureMinimalApiType[];
};
