import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { getErrorMessages } from "@/app/utils/getErrorMessages.util";
import { DnaStructureFormValues } from "@/schemas/forms/base/dna.schema";
import { FormKind } from "@/types/global";

import { DeleteButton } from "../../common/DeleteButton";
import InputWithValidation from "../InputWithValidation";

const emptyDnaStructure: DnaStructureFormValues = {
  dna: {
    code: "",
    description: "",
  },
};

export const FieldSetDna = ({ formKind = FormKind.FINALISATION }: Props) => {
  const { control, watch, setValue, formState } = useFormContext();

  const dnaStructuresErrors = getErrorMessages(formState, "dnaStructures");

  const dnaStructures = (watch("dnaStructures") || [
    emptyDnaStructure,
  ]) as DnaStructureFormValues[];
  const isMultiDna = watch("isMultiDna");

  useEffect(() => {
    if (!isMultiDna) {
      setValue("dnaStructures", [watch("dnaStructures")?.[0]]);
    }
  }, [isMultiDna, setValue, watch]);

  const handleDeleteDna = (index: number) => {
    setValue(
      "dnaStructures",
      dnaStructures.filter((_, i) => i !== index)
    );
  };

  const handleAddNewDna = () => {
    setValue("dnaStructures", [...dnaStructures, emptyDnaStructure]);
  };

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-lg font-bold mb-2 text-title-blue-france">
        Codes DNA
      </legend>
      {dnaStructures.map((_, index) => (
        <div key={index} className="flex gap-6 items-end">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`dnaStructures.${index}.dna.code`}
                id={`dnaStructures.${index}.dna.code`}
                control={control}
                type="text"
                label="Code"
                state={dnaStructuresErrors.length > 0 ? "error" : undefined}
                stateRelatedMessage={
                  dnaStructuresErrors.length > 0
                    ? dnaStructuresErrors[0]
                    : undefined
                }
                disabled={formKind === FormKind.MODIFICATION || index === 0}
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <InputWithValidation
                name={`dnaStructures.${index}.dna.description`}
                id={`dnaStructures.${index}.dna.description`}
                control={control}
                type="text"
                label="Description"
              />
            </div>
          </div>
          <div className="w-8 mb-1">
            {index >= 1 && formKind !== FormKind.MODIFICATION && (
              <DeleteButton
                onClick={() => handleDeleteDna(index)}
                size="small"
                backgroundColor="grey"
              />
            )}
          </div>
        </div>
      ))}
      {isMultiDna && formKind !== FormKind.MODIFICATION && (
        <Button
          type="button"
          iconId="fr-icon-add-line"
          priority="tertiary no outline"
          className="underline font-normal p-0"
          onClick={handleAddNewDna}
        >
          Ajouter un code DNA
        </Button>
      )}
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
};
