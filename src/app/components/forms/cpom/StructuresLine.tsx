import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { cn } from "@/app/utils/classname.util";
import { formatDate } from "@/app/utils/date.util";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const StructuresLine = ({
  structure,
  index,
  handleStructureChange,
}: Props) => {
  const { watch, control } = useFormContext();

  const [isEditable, setIsEditable] = useState(false);

  const cpomStructure = watch("structures");

  const cpomDateStart = watch("dateStart");
  const cpomDateEnd = watch("dateEnd");

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 py-2 px-4">
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
                onChange: () => {
                  if (index !== -1) {
                    setIsEditable(false);
                  }
                  handleStructureChange(structure.id);
                },
              },
            },
          ]}
          className={cn(
            "!my-2",
            "[&_legend]:!p-0",
            "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 [&_label]:text-mention-grey [&_label]:font-bold"
          )}
          small
        />
      </div>
      {isEditable ? (
        <>
          <InputWithValidation
            disabled={index === -1}
            name={index !== -1 ? `structures.${index}.dateStart` : ""}
            id={index !== -1 ? `structures.${index}.dateStart` : ""}
            control={control}
            type="date"
            label=""
            className="!mb-0 w-48"
          />
          <span className="w-4 text-center">–</span>
          <InputWithValidation
            disabled={index === -1}
            name={index !== -1 ? `structures.${index}.dateEnd` : ""}
            id={index !== -1 ? `structures.${index}.dateEnd` : ""}
            control={control}
            type="date"
            label=""
            className="!mb-0 w-48"
          />
        </>
      ) : (
        index !== -1 && (
          <>
            <span className="w-48 text-center">
              {formatDate(cpomStructure[index].dateStart ?? cpomDateStart)}
            </span>
            <span className="w-4 text-center">–</span>
            <span className="w-48 text-center">
              {formatDate(cpomStructure[index].dateEnd ?? cpomDateEnd)}
            </span>
          </>
        )
      )}
      <div className="w-6">
        {index !== -1 && !isEditable && (
          <Button
            iconId="fr-icon-edit-box-line"
            className="ml-auto rounded-4xl"
            onClick={() => {
              setIsEditable(!isEditable);
            }}
            priority="tertiary no outline"
            title="Éditer les dates d'entrée et de sortie"
          />
        )}
      </div>
    </div>
  );
};

type Props = {
  structure: StructureMinimalApiType;
  index: number;
  handleStructureChange: (structureId?: number) => void;
};
