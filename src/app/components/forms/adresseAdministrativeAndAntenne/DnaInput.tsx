import { useFormContext } from "react-hook-form";

import { getErrorMessages } from "@/app/utils/getErrorMessages.util";

import InputWithValidation from "../InputWithValidation";

export const DnaInput = ({ index, disabled, label }: Props) => {
  const { control, formState } = useFormContext();
  const dnaStructuresErrors = getErrorMessages(
    formState,
    "dnaStructures",
    index
  );

  return (
    <div className="relative">
      <InputWithValidation
        name={`dnaStructures.${index}.dna.code`}
        id={`dnaStructures.${index}.dna.code`}
        control={control}
        type="text"
        label={label}
        state={dnaStructuresErrors.length > 0 ? "error" : undefined}
        stateRelatedMessage={
          dnaStructuresErrors.length > 0 ? dnaStructuresErrors[0] : undefined
        }
        disabled={disabled}
        className="mb-0 [&_label]:text-black! [&_input]:text-black!"
      />
      {disabled && (
        <span className="absolute right-4 top-10 fr-icon-lock-line fr-icon--sm pointer-events-none" />
      )}
    </div>
  );
};

type Props = {
  index: number;
  disabled?: boolean;
  label: string;
};
