import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { DnaStructureFormValues } from "@/schemas/forms/base/dna.schema";

import InputWithValidation from "../InputWithValidation";

const emptyDnaStructure: DnaStructureFormValues = {
  dna: {
    code: "",
    description: "",
  },
};

export const FieldSetDna = () => {
  const { control, watch, setValue } = useFormContext();

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
        <div key={index} className="flex gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`dnaStructures.${index}.dna.code`}
                id={`dnaStructures.${index}.dna.code`}
                control={control}
                type="text"
                label="Code"
              />{" "}
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
          {index >= 1 && (
            <Button
              iconId="fr-icon-delete-bin-line"
              priority="tertiary no outline"
              className="mt-8"
              title="Supprimer"
              onClick={() => handleDeleteDna(index)}
              type="button"
            />
          )}
        </div>
      ))}
      {isMultiDna && (
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
