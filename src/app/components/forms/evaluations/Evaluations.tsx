import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { ReactElement } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";

import { Evaluation } from "./Evaluation";

export const Evaluations = (): ReactElement => {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "evaluations",
  });

  const evaluations = watch("evaluations") || [];
  const noEvaluationStructure = watch("noEvaluationStructure");

  const createNewEvaluation = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const newField = {
      date: "",
      notePersonne: null,
      notePro: null,
      noteStructure: null,
      note: null,
      uuid: uuidv4(),
    };

    append(newField);
  };

  const deleteEvaluation = (index: number) => {
    remove(index);
  };

  return (
    <fieldset className="flex flex-col gap-6 w-full">
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        Évaluations
      </legend>
      <Controller
        control={control}
        name="noEvaluationStructure"
        defaultValue={false}
        render={({ field }) => (
          <Checkbox
            className="mb-8"
            options={[
              {
                label:
                  "Cette structure n’a pas encore fait l’objet d’évaluation car elle a été créée récemment.",
                nativeInputProps: {
                  name: field.name,
                  checked: field.value,
                  onChange: (e) => {
                    field.onChange(e.target.checked);
                  },
                },
              },
            ]}
          />
        )}
      />
      {!noEvaluationStructure &&
        evaluations.map((field: EvaluationFormValues, index: number) => {
          return (
            <Evaluation
              key={field.id || field.uuid}
              field={field}
              index={index}
              deleteEvaluation={() => deleteEvaluation(index)}
            />
          );
        })}
      {!noEvaluationStructure && (
        <Button
          onClick={createNewEvaluation}
          priority="tertiary no outline"
          className="underline font-normal p-0"
        >
          + Ajouter une évaluation
        </Button>
      )}
    </fieldset>
  );
};
