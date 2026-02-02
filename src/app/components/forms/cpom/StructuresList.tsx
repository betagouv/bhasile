import { useFormContext } from "react-hook-form";

import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import { CpomStructureFormValues } from "@/schemas/forms/base/cpom.schema";

import { StructuresLine } from "./StructuresLine";

export const StructuresList = ({ structures }: Props) => {
  const { watch, setValue } = useFormContext();

  if (!structures) {
    return null;
  }

  const selectedCpomStructures = watch(
    "structures"
  ) as CpomStructureFormValues[];

  const handleStructureChange = (structureId?: number) => {
    if (!structureId) {
      return;
    }
    if (
      selectedCpomStructures?.find(
        (structure) => structure.structureId === structureId
      )
    ) {
      setValue(
        "structures",
        selectedCpomStructures.filter(
          (structure) => structure.structureId !== structureId
        )
      );
    } else {
      setValue("structures", [
        ...selectedCpomStructures,
        {
          dateStart: undefined,
          dateEnd: undefined,
          structureId: structureId,
        },
      ]);
    }
  };

  return (
    <div>
      {structures.map((structure) => (
        <StructuresLine
          key={structure.id}
          structure={structure}
          index={selectedCpomStructures.findIndex(
            (selectedCpomStructure) =>
              selectedCpomStructure.structureId === structure.id
          )}
          handleStructureChange={handleStructureChange}
        />
      ))}
    </div>
  );
};

type Props = {
  structures?: StructureMinimalApiType[];
};
