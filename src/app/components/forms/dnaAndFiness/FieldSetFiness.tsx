import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { isBlank } from "@/app/utils/common.util";
import { StructureFinessFormValues } from "@/schemas/forms/base/finess.schema";

import { DeleteButton } from "../../common/DeleteButton";
import InputWithValidation from "../InputWithValidation";

const emptyStructureFiness: StructureFinessFormValues = {
  description: "",
  finess: {
    code: "",
  },
};

const isFinessEmpty = (structureFiness: StructureFinessFormValues): boolean =>
  isBlank(structureFiness?.finess?.code) &&
  isBlank(structureFiness?.description);

export const FieldSetFiness = () => {
  const { control, watch, setValue } = useFormContext();

  const structureFinesses = (watch("structureFinesses") || [
    emptyStructureFiness,
  ]) as StructureFinessFormValues[];

  const isMultiDna = watch("isMultiDna");

  useEffect(() => {
    if (!isMultiDna) {
      setValue("structureFinesses", [watch("structureFinesses")?.[0]]);
    }
  }, [isMultiDna, setValue, watch]);

  const handleDeleteFiness = (index: number) => {
    if (structureFinesses.length > 1) {
      setValue(
        "structureFinesses",
        structureFinesses.filter((_, finessIndex) => finessIndex !== index)
      );
      return;
    }
    setValue("structureFinesses", [emptyStructureFiness]);
  };

  const handleAddNewFiness = () => {
    setValue("structureFinesses", [...structureFinesses, emptyStructureFiness]);
  };

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-lg font-bold mb-2 text-title-blue-france">
        Codes FINESS
      </legend>
      {structureFinesses.map((structureFiness, index) => (
        <div key={index} className="flex gap-6 items-start">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`structureFinesses.${index}.finess.code`}
                id={`structureFinesses.${index}.finess.code`}
                control={control}
                type="text"
                label="Code"
              />{" "}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <InputWithValidation
                name={`structureFinesses.${index}.description`}
                id={`structureFinesses.${index}.description`}
                control={control}
                type="text"
                label="Description"
                className="mb-0"
              />
              <span className="text-[#666666] text-sm">
                ex : Toute la structure
              </span>
            </div>
          </div>
          <div className="w-8 mt-9">
            {(structureFinesses.length > 1 ||
              !isFinessEmpty(structureFiness)) && (
              <DeleteButton
                onClick={() => handleDeleteFiness(index)}
                size="small"
                backgroundColor="grey"
              />
            )}
          </div>
        </div>
      ))}
      {isMultiDna && (
        <Button
          type="button"
          iconId="fr-icon-add-line"
          priority="tertiary no outline"
          className="underline font-normal p-0"
          onClick={handleAddNewFiness}
        >
          Ajouter un code FINESS
        </Button>
      )}
    </fieldset>
  );
};
