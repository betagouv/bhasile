import { useFormContext } from "react-hook-form";

import { Table } from "@/app/components/common/Table";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import { CpomStructureFormValues } from "@/schemas/forms/base/cpom.schema";

export const StructuresTable = ({ structures }: Props) => {
  const { control, watch } = useFormContext();

  if (!structures) {
    return null;
  }

  const selectedCpomStructures = watch(
    "structures"
  ) as CpomStructureFormValues[];

  const selectedStructures: StructureWithIndex[] = structures
    ?.filter((structure) =>
      selectedCpomStructures.find(
        (selectedCpomStructure) =>
          selectedCpomStructure.structureId === structure.id
      )
    )
    .map((structure) => ({
      ...structure,
      index: selectedCpomStructures.findIndex(
        (selectedCpomStructure) =>
          selectedCpomStructure.structureId === structure.id
      ),
    }));

  return (
    <Table
      headings={["DNA", "Date d'entrée en CPOM", "Date de sortie du CPOM"]}
      ariaLabelledBy="structures-table"
    >
      {selectedStructures?.map((structure) => (
        <tr key={structure.dnaCode}>
          <td>{structure.dnaCode}</td>
          <td>
            <InputWithValidation
              name={`structures.${structure.index}.dateStart`}
              id={`structures.${structure.index}.dateStart`}
              control={control}
              type="date"
              label=""
            />
          </td>
          <td>
            <InputWithValidation
              name={`structures.${structure.index}.dateEnd`}
              id={`structures.${structure.index}.dateEnd`}
              control={control}
              type="date"
              label=""
            />
          </td>
        </tr>
      ))}
    </Table>
  );
};

type Props = {
  structures?: StructureMinimalApiType[];
};

type StructureWithIndex = StructureMinimalApiType & {
  index: number;
};
