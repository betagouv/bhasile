import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { FinessFormValues } from "@/schemas/forms/base/finess.schema";

import { DeleteButton } from "../../common/DeleteButton";
import InputWithValidation from "../InputWithValidation";

const emptyFiness: FinessFormValues = {
  code: "",
  description: "",
};

export const FieldSetFiness = () => {
  const { control, watch, setValue } = useFormContext();

  const finesses = (watch("finesses") || [emptyFiness]) as FinessFormValues[];

  const isMultiDna = watch("isMultiDna");

  useEffect(() => {
    if (!isMultiDna) {
      setValue("finesses", [watch("finesses")?.[0]]);
    }
  }, [isMultiDna, setValue, watch]);

  const handleDeleteFiness = (index: number) => {
    setValue(
      "finesses",
      finesses.filter((_, i) => i !== index)
    );
  };

  const handleAddNewFiness = () => {
    setValue("finesses", [...finesses, emptyFiness]);
  };

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-lg font-bold mb-2 text-title-blue-france">
        Codes FINESS
      </legend>
      {finesses.map((_, index) => (
        <div key={index} className="flex gap-6 items-start">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1">
            <div className="flex flex-col gap-1">
              <InputWithValidation
                name={`finesses.${index}.code`}
                id={`finesses.${index}.code`}
                control={control}
                type="text"
                label="Code"
              />{" "}
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <InputWithValidation
                name={`finesses.${index}.description`}
                id={`finesses.${index}.description`}
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
            {index >= 1 && (
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
