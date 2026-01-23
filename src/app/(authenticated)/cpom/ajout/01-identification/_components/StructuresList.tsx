import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useFormContext } from "react-hook-form";

import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import { CpomStructureFormType } from "@/schemas/forms/cpom/cpomAjoutIdentification.schema";

export const StructuresList = ({ structures }: Props) => {
  const { watch, setValue } = useFormContext();

  if (!structures) {
    return null;
  }

  const selectedStructures = watch("structures") as CpomStructureFormType[];

  const handleStructureChange = (structureId?: number) => {
    if (!structureId) {
      return;
    }
    if (
      selectedStructures?.find(
        (structure) => structure.structureId === structureId
      )
    ) {
      setValue(
        "structures",
        selectedStructures.filter(
          (structure) => structure.structureId !== structureId
        )
      );
    } else {
      setValue("structures", [
        ...selectedStructures,
        {
          yearStart: undefined,
          yearEnd: undefined,
          structureId: structureId,
        },
      ]);
    }
  };

  return (
    <Checkbox
      legend="Sélectionnez les structures"
      options={structures?.map((structure) => ({
        label: structure.dnaCode,
        nativeInputProps: {
          name: "structures",
          value: structure.id,
          checked: !!selectedStructures?.find(
            (selectedStructure) =>
              selectedStructure.structureId === structure.id
          ),
          onChange: () => handleStructureChange(structure.id),
        },
      }))}
      orientation="horizontal"
    />
  );
};

type Props = {
  structures?: StructureMinimalApiType[];
};
