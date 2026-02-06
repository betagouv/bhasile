import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { StructureMinimalApiType } from "@/schemas/api/structure.schema";
import { CpomStructureFormValues } from "@/schemas/forms/base/cpom.schema";

import { StructureLine } from "./StructureLine";

export const StructuresList = ({ structures }: Props) => {
  const { watch, setValue, formState } = useFormContext();

  const hasErrors = useMemo(
    () => !!formState.errors?.structures,
    [formState.errors]
  );

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

  const checkedStatus = useMemo(() => {
    const numOfDepartementsChecked = selectedCpomStructures.length;
    const totalStructures = structures?.length;

    if (numOfDepartementsChecked === totalStructures) {
      return "checked";
    }
    if (numOfDepartementsChecked > 0) {
      return "incomplete";
    }
    return "unchecked";
  }, [selectedCpomStructures, structures]);

  const handleAllStructuresChange = (checked: boolean) => {
    if (checked) {
      setValue(
        "structures",
        structures.map((structure) => ({
          structureId: structure.id,
          dateStart: undefined,
          dateEnd: undefined,
        }))
      );
    } else {
      setValue("structures", []);
    }
  };

  return (
    <>
      <div
        className={cn(
          "max-w-3xl",
          hasErrors && "border border-solid border-action-high-error rounded-lg"
        )}
      >
        <div className="flex items-center gap-4 border-b border-gray-200 py-2 px-4">
          <div className="flex-1">
            <Checkbox
              options={[
                {
                  label:
                    checkedStatus !== "unchecked"
                      ? "Tout déselectionner"
                      : "Tout sélectionner",
                  nativeInputProps: {
                    name: "isAllStructuresSelected",
                    value: "isAllStructuresSelected",
                    checked: checkedStatus !== "unchecked",
                    onChange: (e) => {
                      handleAllStructuresChange(e.target.checked);
                    },
                  },
                },
              ]}
              className={cn(
                "mb-0",
                "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 [&_label]:text-title-blue-france [&_label]:font-bold",
                checkedStatus === "incomplete" &&
                  "[&>label:before]:bg-none [&:before]:content-[''] [&:before]:absolute [&:before]:z-10 [&:before]:top-1/2 [&:before]:-translate-y-1/2 [&:before]:left-1 [&:before]:w-2 [&:before]:h-[1px] [&:before]:bg-white"
              )}
              small
            />
          </div>
          <div className="w-48 text-center font-bold text-sm">ENTRÉE</div>
          <div className="w-4"></div>
          <div className="w-48 text-center font-bold text-sm">SORTIE</div>
          <div className="w-6"></div>
        </div>
        {structures.map((structure) => (
          <StructureLine
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
      {hasErrors && (
        <p className="text-default-error m-0 p-0">
          Les dates d’entrée et de sortie des structures doivent se situer dans
          l’intervalle de dates d’entrée et de sortie du CPOM
        </p>
      )}
    </>
  );
};

type Props = {
  structures: StructureMinimalApiType[];
};
