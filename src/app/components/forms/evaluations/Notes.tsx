import { ReactElement } from "react";
import { useFormContext } from "react-hook-form";

import { EVALUATION_NOTE_MAX, EVALUATION_NOTE_MIN } from "@/constants";

import InputWithValidation from "../InputWithValidation";

export const Notes = ({ index }: Props): ReactElement => {
  const { control } = useFormContext();

  return (
    <div className="flex pb-6">
      <div>
        <h4 className="font-normal mb-0 text-base">Notes</h4>
        <div className="flex">
          <div className="flex pr-6 items-start">
            <InputWithValidation
              name={`evaluations.${index}.notePersonne`}
              min={EVALUATION_NOTE_MIN}
              max={EVALUATION_NOTE_MAX}
              control={control}
              label="La personne"
              className="w-full mb-0 [&>label]:italic [&>label]:text-sm"
              type="number"
            />
            <span className="pl-2 pb-2">/4</span>
          </div>
          <div className="flex pr-6 items-start">
            <InputWithValidation
              name={`evaluations.${index}.notePro`}
              min={EVALUATION_NOTE_MIN}
              max={EVALUATION_NOTE_MAX}
              control={control}
              label="Les professionnels"
              className="w-full mb-0 [&>label]:italic [&>label]:text-sm"
              type="number"
            />
            <span className="pl-2 pb-2">/4</span>
          </div>
          <div className="flex pr-6 items-start">
            <InputWithValidation
              name={`evaluations.${index}.noteStructure`}
              min={EVALUATION_NOTE_MIN}
              max={EVALUATION_NOTE_MAX}
              control={control}
              label="La structure"
              className="w-full mb-0 [&>label]:italic [&>label]:text-sm"
              type="number"
            />
            <span className="pl-2 pb-2">/4</span>
          </div>
          <div className="flex items-start">
            <InputWithValidation
              name={`evaluations.${index}.note`}
              min={EVALUATION_NOTE_MIN}
              max={EVALUATION_NOTE_MAX}
              control={control}
              label="Moyenne"
              className="w-full mb-0 [&>label]:italic [&>label]:text-sm"
              type="number"
            />
            <span className="pl-2 pb-2">/4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

type Props = {
  index: number;
};
