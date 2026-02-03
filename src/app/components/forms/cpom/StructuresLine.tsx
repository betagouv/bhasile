import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const StructuresLine = ({
  structure,
  index,
  handleStructureChange,
}: Props) => {
  const { control } = useFormContext();

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 px-2">
      <div className="flex-1">
        <Checkbox
          legend=""
          options={[
            {
              label: structure.dnaCode,
              nativeInputProps: {
                name: "structures",
                value: structure.id,
                checked: index !== -1,
                onChange: () => handleStructureChange(structure.id),
              },
            },
          ]}
          orientation="horizontal"
        />
      </div>
      <InputWithValidation
        disabled={index === -1}
        name={index !== -1 ? `structures.${index}.dateStart` : ""}
        id={index !== -1 ? `structures.${index}.dateStart` : ""}
        control={control}
        type="date"
        label=""
        className="!mb-0"
      />
      –
      <InputWithValidation
        disabled={index === -1}
        name={index !== -1 ? `structures.${index}.dateEnd` : ""}
        id={index !== -1 ? `structures.${index}.dateEnd` : ""}
        control={control}
        type="date"
        label=""
      />
    </div>
  );
};

type Props = {
  structure: StructureMinimalApiType;
  index: number;
  handleStructureChange: (structureId?: number) => void;
};
