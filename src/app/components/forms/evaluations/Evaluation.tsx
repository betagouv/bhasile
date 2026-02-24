import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { formatDate, getYearFromDate } from "@/app/utils/date.util";
import { EvaluationFormValues } from "@/schemas/forms/base/evaluation.schema";

import InputWithValidation from "../InputWithValidation";
import UploadWithValidation from "../UploadWithValidation";
import { Notes } from "./Notes";

export const Evaluation = ({
  index,
  field,
  deleteEvaluation,
}: Props): ReactElement => {
  const { watch, control, register } = useFormContext();
  const evaluations = watch("evaluations") || [];
  const currentEvaluation = evaluations[index];
  const [type, setType] = useState<"empty" | "old" | "new">("empty");

  const setEvaluationType = (date: string): void => {
    const evaluationYear = getYearFromDate(date);
    if (!evaluationYear) {
      setType("empty");
    }
    if (evaluationYear < 2022) {
      setType("old");
    }
    if (evaluationYear >= 2022) {
      setType("new");
    }
  };

  const handleType = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEvaluationType(event.target.value);
  };

  useEffect(() => {
    setEvaluationType(currentEvaluation.date);
  }, [currentEvaluation]);

  const isNewEvaluation = () =>
    isNaN(new Date(currentEvaluation?.date).getTime());

  return (
    <div>
      <h3 className="text-xl font-bold mb-4 text-title-blue-france">
        {isNewEvaluation()
          ? "Nouvelle évaluation"
          : `Evaluation du ${formatDate(currentEvaluation?.date)}`}
      </h3>
      <div className="flex justify-between items-start">
        <div className="w-full">
          <div className="flex pb-6">
            <InputWithValidation
              name={`evaluations.${index}.date`}
              defaultValue={field.date}
              control={control}
              label="Date"
              className="w-fit mb-0"
              type="date"
              onChange={handleType}
            />
            <InputWithValidation
              name={`evaluations.${index}.id`}
              control={control}
              label=""
              type="hidden"
            />
            {type !== "empty" && (
              <div className="mx-8 border-r border-default-grey" />
            )}
            {type === "old" && (
              <div className="flex flex-col grow">
                <p className="mb-2">Rapport</p>
                <UploadWithValidation
                  name={`evaluations.${index}.fileUploads.0.key`}
                  control={control}
                />
                <input
                  type="hidden"
                  {...register(`evaluations.${index}.fileUploads.0.category`)}
                  defaultValue="EVALUATION"
                />
              </div>
            )}
            {type === "new" && <Notes index={index} field={field} />}
          </div>
          {type === "new" && (
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col">
                <p className="mb-2">Rapport</p>
                <UploadWithValidation
                  name={`evaluations.${index}.fileUploads.0.key`}
                  control={control}
                />
                <input
                  type="hidden"
                  {...register(`evaluations.${index}.fileUploads.0.category`)}
                  defaultValue="EVALUATION"
                />
              </div>
              <div className="flex flex-col">
                <p className="mb-2">Plan d’action (optionnel)</p>
                <UploadWithValidation
                  name={`evaluations.${index}.fileUploads.1.key`}
                  control={control}
                />
                <input
                  type="hidden"
                  {...register(`evaluations.${index}.fileUploads.1.category`)}
                  defaultValue="EVALUATION"
                />
              </div>
            </div>
          )}
        </div>
        {index > 0 && (
          <Button
            iconId="fr-icon-delete-bin-line"
            priority="tertiary no outline"
            className="ml-8"
            title="Supprimer"
            onClick={() => {
              const confirm = window.confirm(
                "Attention, vous allez supprimer définitivement cette évaluation. Êtes-vous bien sûr·e de vouloir continuer ?"
              );
              if (confirm) {
                deleteEvaluation(index);
              }
            }}
            type="button"
          />
        )}
      </div>
    </div>
  );
};

type Props = {
  index: number;
  field: EvaluationFormValues;
  deleteEvaluation: (index: number) => void;
};
